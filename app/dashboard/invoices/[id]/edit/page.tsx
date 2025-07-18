import { fetchCustomers, fetchInvoiceById } from "@/app/lib/data";
import EditInvoiceForm from "@/app/ui/invoices/edit-form";
import { Metadata } from "next";
import { notFound } from "next/navigation";
export const metadata: Metadata = {
  title: 'Invoices',
};
export default async function page(props :{params :Promise<{id :string}>}){
    const params = await props.params; 
    const id = params.id;
    const [invoice , customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ])
    if (!invoice) {
        notFound();
    }
    return (<>
        <EditInvoiceForm invoice={invoice} customers ={customers}></EditInvoiceForm>
    </>)
}