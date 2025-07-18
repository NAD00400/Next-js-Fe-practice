'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const FormSchema = z.object({
    id :z.string(),
    customerId: z.string({invalid_type_error: 'Please select a customer.',}),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {invalid_type_error: 'Please select an invoice status.',}),
    date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoiceSchema = FormSchema.omit({id:true ,date:true })

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function createInvoice(prevState: State, formData: FormData){
    // lấy các key : value từ input chuyển thành obj
    const rawFormData = Object.fromEntries(formData.entries()); 
    // nạp đối tượng vào schema để validate
    const validatedFields = CreateInvoiceSchema.safeParse(rawFormData);

    // Nếu không hợp lệ → trả về lỗi
    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    // console.log(validatedFields);
    
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    
    const amountInCents = amount *100
    //
    const date =new Date().toISOString().split('T')[0];
    // nạp dữ liệu 
    try {
        await sql `
        insert into invoices (customer_id, amount, status, date)
        values (${customerId}, ${amountInCents}, ${status}, ${date}) 
        `
    } catch (error) {
        console.error(error)
    }
    
    //
    revalidatePath('/dashboard/invoices'); // tạo xong xóa dữ liệu trong cache của tuyến đường này và đồng thời gọi lại nó 
    redirect('/dashboard/invoices'); // quay lại trang dshd
}

const UpdateInvoiceSchema = FormSchema.omit({id:true ,date:true })

export async function updateInvoice(id:string, prevState: State, formData:FormData){

    const rawFormData = Object.fromEntries(formData.entries());

    const validatedFields = UpdateInvoiceSchema.safeParse(rawFormData)
    

    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount *100

    try {
        await sql `
        update invoices 
        set customer_id = ${customerId} , amount = ${amountInCents} ,status =${status}
        where id = ${id}
        `

        
    } catch (error) {
        console.error(error)
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function deleteInvoice(id:string){
    
    try {
        await sql `
        delete from invoices where id =${id}
        `
        revalidatePath('/dashboard/invoices')
    } catch (error) {
        console.error(error)    
    }
   
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}