import { NextRequest, NextResponse } from 'next/server';
import { getAllOrdersFromFirebase } from '@/lib/firebaseOrders';

// Simple email sending function (using a service like Resend, SendGrid, or Nodemailer)
// For production, replace with actual email service
async function sendEmail(to: string, subject: string, html: string) {
    // TODO: Replace with actual email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ from: 'orders@taruvae.com', to, subject, html });

    console.log(`[Email] Would send to ${to}: ${subject}`);
    console.log(`[Email] Content: ${html.substring(0, 200)}...`);
    return { success: true };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, order: orderPayload } = body || {};
        const resolvedOrderId = orderId || orderPayload?.orderId;

        if (!resolvedOrderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        let order = orderPayload;
        if (!order) {
            const orders = await getAllOrdersFromFirebase();
            order = orders.find(o => o.orderId === resolvedOrderId);
        }

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }
        if (!order.customer?.email || !order.shippingAddress || !Array.isArray(order.items)) {
            return NextResponse.json(
                { error: 'Invalid order data' },
                { status: 400 }
            );
        }

        // Generate invoice HTML
        const invoiceHtml = generateInvoiceHtml(order);

        // Send customer email (non-blocking)
        const customerEmailPromise = sendEmail(
            order.customer.email,
            `Order Confirmation - ${order.orderId || resolvedOrderId}`,
            generateCustomerEmailHtml(order, invoiceHtml)
        ).catch(err => {
            console.error('Customer email failed:', err);
            return { success: false };
        });

        // Send admin email (non-blocking)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@taruvae.com';
        const adminEmailPromise = sendEmail(
            adminEmail,
            `New Order Received - ${order.orderId || resolvedOrderId}`,
            generateAdminEmailHtml(order)
        ).catch(err => {
            console.error('Admin email failed:', err);
            return { success: false };
        });

        // Wait for both emails (but don't fail if they fail)
        await Promise.allSettled([customerEmailPromise, adminEmailPromise]);

        return NextResponse.json({
            success: true,
            message: 'Emails sent successfully',
        });
    } catch (error: any) {
        console.error('Email sending error:', error);
        // Don't fail the request if email fails
        return NextResponse.json({
            success: false,
            error: error.message || 'Email sending failed (non-critical)',
        }, { status: 500 });
    }
}

function generateInvoiceHtml(order: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice - ${order.orderId}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                .invoice-container { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #eee; padding: 40px; }
                .header { border-bottom: 2px solid #1F3D2B; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .logo { color: #1F3D2B; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
                .invoice-title { font-size: 14px; font-weight: bold; color: #B08D57; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 3px; }
                .details { margin-bottom: 40px; }
                .details-table { width: 100%; }
                .details-table td { width: 50%; vertical-align: top; }
                h3 { font-size: 12px; font-weight: bold; color: #1F3D2B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
                p { font-size: 14px; line-height: 1.6; margin: 0; color: #666; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th { background: #1F3D2B; color: #fff; text-align: left; padding: 12px 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
                .items-table td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; }
                .items-table .text-right { text-align: right; }
                .items-table .text-center { text-align: center; }
                .totals { float: right; width: 300px; }
                .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f9f9f9; }
                .total-row.final { border-top: 2px solid #1F3D2B; margin-top: 10px; padding-top: 15px; font-weight: bold; color: #1F3D2B; font-size: 18px; }
                .footer { margin-top: 60px; text-align: center; border-top: 1px solid #eee; pt-20px; color: #999; font-size: 11px; }
                .status-badge { display: inline-block; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 10px; }
                .status-paid { background: #E6F4EA; color: #1E8E3E; }
                .status-pending { background: #FEF7E0; color: #B05E27; }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div>
                        <h1 class="logo">TARUVAÉ</h1>
                        <p class="invoice-title">Naturals & Organics</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-weight: bold; color: #1F3D2B;">INVOICE #${order.orderId}</p>
                        <p>Date: ${new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
                    </div>
                </div>
                
                <div class="details">
                    <table class="details-table">
                        <tr>
                            <td>
                                <h3>Bill To:</h3>
                                <p><strong>${order.customer.firstName} ${order.customer.lastName}</strong></p>
                                <p>${order.customer.email}</p>
                                <p>${order.customer.phone}</p>
                            </td>
                            <td>
                                <h3>Ship To:</h3>
                                <p>${order.shippingAddress.address}</p>
                                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map((item: any) => `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">₹${item.price.toLocaleString('en-IN')}</td>
                                <td class="text-right">₹${item.total.toLocaleString('en-IN')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="overflow: hidden;">
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>₹${order.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        ${order.discount ? `
                        <div class="total-row" style="color: #1E8E3E;">
                            <span>Discount</span>
                            <span>-₹${order.discount.toLocaleString('en-IN')}</span>
                        </div>` : ''}
                        ${order.gst ? `
                        <div class="total-row">
                            <span>GST (18%)</span>
                            <span>₹${order.gst.toLocaleString('en-IN')}</span>
                        </div>` : ''}
                        <div class="total-row">
                            <span>Shipping</span>
                            <span>₹${order.shipping.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="total-row final">
                            <span>TOTAL</span>
                            <span>₹${order.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 40px;">
                    <h3>Payment Information</h3>
                    <p>Method: ${order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</p>
                    <div class="status-badge ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
                        ${order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                    </div>
                    ${order.razorpayPaymentId ? `<p style="font-size: 11px; color: #999; margin-top: 10px;">Transaction ID: ${order.razorpayPaymentId}</p>` : ''}
                </div>

                <div class="footer">
                    <p>Thank you for choosing Taruvaé Naturals. Your support for organic farming makes a difference.</p>
                    <p>&copy; ${new Date().getFullYear()} Taruvaé Naturals. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function generateCustomerEmailHtml(order: any, invoiceHtml: string): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Thank you for your order!</h2>
            <p>Dear ${order.customer.firstName},</p>
            <p>Your order <strong>${order.orderId}</strong> has been confirmed.</p>
            <p><strong>Order Total:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
            ${order.paymentStatus === 'paid' ? '<p><strong>Payment Status:</strong> Paid</p>' : '<p><strong>Payment Status:</strong> Pending (Cash on Delivery)</p>'}
            <p>We will send you tracking information once your order ships.</p>
            <hr>
            ${invoiceHtml}
        </body>
        </html>
    `;
}

function generateAdminEmailHtml(order: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Order</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Order Received</h2>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Customer:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Total Amount:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            ${order.razorpayPaymentId ? `<p><strong>Transaction ID:</strong> ${order.razorpayPaymentId}</p>` : ''}
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <h3>Items:</h3>
            <ul>
                ${order.items.map((item: any) => `<li>${item.name} x ${item.quantity} = ₹${item.total.toLocaleString('en-IN')}</li>`).join('')}
            </ul>
        </body>
        </html>
    `;
}
