import { Resend } from 'resend';

export async function sendShiftReport(type: 'OPEN' | 'CLOSE', shiftData: any) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[MOCK EMAIL] Shift Report (${type}):`, shiftData);
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const subject = `[Akapoolco] Reporte de Caja - ${type === 'OPEN' ? 'Apertura' : 'Cierre'}`;
        const amount = type === 'OPEN'
            ? `Monto Inicial: $${shiftData.initialAmount}`
            : `Monto Final: $${shiftData.finalAmount} (Ventas: $${shiftData.totalSales})`;

        await resend.emails.send({
            from: 'onboarding@resend.dev', // Default testing domain
            to: 'admin@clubsantiago.cl', // Hardcoded as per implementation plan assumption
            subject: subject,
            html: `
                <h1>Reporte de Turno: ${type}</h1>
                <p><strong>Usuario:</strong> ${shiftData.user}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <hr />
                <h2>Resumen Financiero</h2>
                <p>${amount}</p>
                ${type === 'CLOSE' ? `
                <ul>
                    <li>Efectivo: $${shiftData.cash}</li>
                    <li>Tarjeta: $${shiftData.card}</li>
                    <li>Transferencia: $${shiftData.transfer}</li>
                </ul>
                ` : ''}
            `
        });
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}
