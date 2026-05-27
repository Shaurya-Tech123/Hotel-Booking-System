function generateBookingBill(booking) {
    const PDFDocument = require("pdfkit");

    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({ size: "A4", margin: 50 });

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pageWidth = doc.page.width - 100;
        const centerX = 50;

        // Header - hotel name centered, large bold
        doc.font("Helvetica-Bold").fontSize(22);
        doc.text(booking.hotelName, centerX, doc.y, { width: pageWidth, align: "center" });
        doc.moveDown(1.2);

        doc.font("Helvetica").fontSize(11);
        doc.text("INVOICE", centerX, doc.y, { width: pageWidth, align: "center" });
        doc.moveDown(1.5);

        // Divider line
        const lineY = doc.y;
        doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY).stroke("#2563eb");
        doc.moveDown(1);

        const details = [
            ["Guest", booking.username],
            ["Check-in", new Date(booking.checkIn).toLocaleDateString("en-IN")],
            ["Check-out", new Date(booking.checkOut).toLocaleDateString("en-IN")],
            ["Days stayed", String(booking.nights)],
            ["Room category", booking.roomCategory],
            ["Room price / day", `INR ${booking.roomPricePerDay}`]
        ];

        details.forEach(([label, value]) => {
            doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
            doc.font("Helvetica").text(value);
            doc.moveDown(0.4);
        });

        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").fontSize(12).text("Additional Features");
        doc.moveDown(0.3);

        if (booking.selectedFeatures?.length) {
            booking.selectedFeatures.forEach(f => {
                doc.font("Helvetica").fontSize(10).text(`• ${f.name} — INR ${f.price}`);
            });
        } else {
            doc.font("Helvetica").fontSize(10).text("None selected");
        }

        doc.moveDown(1);
        const summaryY = doc.y;
        doc.rect(50, summaryY, pageWidth, 90).fillAndStroke("#f0f9ff", "#2563eb");

        doc.fillColor("#000000").font("Helvetica").fontSize(10);
        doc.text(`Room charges (${booking.nights} nights): INR ${booking.roomTotal}`, 60, summaryY + 15);
        doc.text(`Additional features: INR ${booking.featuresTotal}`, 60, summaryY + 35);

        doc.font("Helvetica-Bold").fontSize(14);
        doc.text(`Total Bill: INR ${booking.totalBill}`, 60, summaryY + 60);

        doc.moveDown(4);
        doc.font("Helvetica").fontSize(9).fillColor("#64748b");
        doc.text("Thank you for choosing our hotel. We hope you had a pleasant stay!", {
            width: pageWidth,
            align: "center"
        });

        doc.end();
    });
}

module.exports = { generateBookingBill };
