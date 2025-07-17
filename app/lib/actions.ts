'use server'

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const FormSchema = z.object({
    id :z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});
const CreateInvoiceSchema = FormSchema.omit({id:true ,date:true })

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function createInvoice(formData:FormData){
    //     const rawFormData ={
    //         customerId :formData.get('customerId'),
    //         amount: formData.get('amount'),
    //     status: formData.get('status'),
    //   };

    // thay vì lặp lại code customerId :formData.get('customerId') cho từng thuộc tính thì chỉ dùng dòng này là đủ
    const rawFormData = Object.fromEntries(formData.entries()); 
    const {customerId, amount, status} = CreateInvoiceSchema.parse(rawFormData)
    const amountInCents = amount *100
    const date =new Date().toISOString().split('T')[0];
    // nạp dữ liệu 
    await sql `
    insert into invoices (customer_id, amount, status, date)
    values (${customerId}, ${amountInCents}, ${status}, ${date}) 
    `

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}