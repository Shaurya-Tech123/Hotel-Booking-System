const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

async function generateInvoicePdf(invoice, booking) {
    const outDir = path.join(process.cwd(), "data", "invoices");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${invoice.invoiceNumber}.pdf`);

    await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc.fontSize(18).text("Hotel Management Invoice");
        doc.moveDown();
        doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Booking ID: ${booking._id}`);
        doc.text(`Room Type: ${booking.roomType}`);
        doc.text(`Nights: ${booking.nights}`);
        doc.text(`Total Amount: INR ${booking.totalAmount}`);
        doc.text(`Tax: INR ${invoice.tax}`);
        doc.text(`Grand Total: INR ${invoice.grandTotal}`);
        doc.end();
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    return filePath;
}

module.exports = { generateInvoicePdf };
