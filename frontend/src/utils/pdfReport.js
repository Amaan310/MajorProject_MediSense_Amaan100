import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generatePDFReport(result, inputData) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const blue = [37, 99, 235], green = [22, 163, 74], red = [220, 38, 38], amber = [217, 119, 6];
  const dark = [10, 10, 15], gray = [100, 100, 120];

  const addPage = () => { doc.addPage(); return 20; };

  // ── Cover ─────────────────────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, W, 45, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MediSense AI", 15, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Health Analysis Report  •  Powered by Google Gemini", 15, 27);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 15, 35);

  // ── Result Summary ─────────────────────────────────────────────────────────
  const isHigh = result.risk_level === "High";
  const riskColor = isHigh ? red : result.risk_level === "Medium" ? amber : green;
  doc.setFillColor(isHigh ? 254 : result.risk_level === "Medium" ? 255 : 240, isHigh ? 226 : result.risk_level === "Medium" ? 237 : 253, isHigh ? 226 : result.risk_level === "Medium" ? 213 : 244);
  doc.roundedRect(15, 55, W - 30, 30, 3, 3, "F");
  doc.setTextColor(...riskColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(result.detected_disease || "Analysis Complete", 22, 66);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Risk Level: ${result.risk_level}   |   Confidence: ${result.confidence}`, 22, 76);

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 96;
  if (result.summary) {
    const lines = doc.splitTextToSize(result.summary, W - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 8;
  }

  // ── Extracted Values ───────────────────────────────────────────────────────
  if (result.extracted_values && Object.keys(result.extracted_values).length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...blue);
    doc.text("Extracted Lab Values", 15, y); y += 5;
    const rows = Object.entries(result.extracted_values).map(([k, v]) => [k, v]);
    autoTable(doc, {
      startY: y, head: [["Parameter", "Value"]],
      body: rows, headStyles: { fillColor: blue, fontSize: 9 },
      bodyStyles: { fontSize: 9 }, alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Abnormal Values ────────────────────────────────────────────────────────
  if (result.abnormal_values?.length > 0) {
    if (y > 240) y = addPage();
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...red);
    doc.text("Abnormal Values", 15, y); y += 5;
    autoTable(doc, {
      startY: y, head: [["Parameter", "Value", "Normal Range", "Status"]],
      body: result.abnormal_values.map(a => [a.parameter, a.value, a.normal_range, a.status]),
      headStyles: { fillColor: red, fontSize: 9 }, bodyStyles: { fontSize: 9 },
      margin: { left: 15, right: 15 }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── AI Explanation ─────────────────────────────────────────────────────────
  doc.addPage(); y = 20;
  doc.setFillColor(99, 102, 241); doc.rect(0, 0, W, 20, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("AI Explanation & Health Guide", 15, 13);

  y = 30;
  if (result.explanation?.why_detected) {
    doc.setTextColor(...dark); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("Why This Was Detected", 15, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const lines = doc.splitTextToSize(result.explanation.why_detected, W - 30);
    doc.text(lines, 15, y); y += lines.length * 5 + 6;
  }

  const addList = (title, items, color) => {
    if (!items?.length) return;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(...color); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(title, 15, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...dark);
    items.forEach(item => {
      if (y > 270) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`• ${item}`, W - 30);
      doc.text(lines, 18, y); y += lines.length * 5 + 2;
    });
    y += 4;
  };

  addList("Do's", result.dos, green);
  addList("Don'ts", result.donts, red);

  // ── Diet Chart ─────────────────────────────────────────────────────────────
  if (result.diet_chart) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(...amber); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("Personalized Diet Chart", 15, y); y += 5;
    const meals = ["morning", "breakfast", "mid_morning", "lunch", "evening", "dinner"];
    const dietRows = meals.filter(m => result.diet_chart[m]?.length).map(m => [
      m.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      result.diet_chart[m].join(", ")
    ]);
    if (result.diet_chart.avoid?.length) dietRows.push(["AVOID", result.diet_chart.avoid.join(", ")]);
    autoTable(doc, {
      startY: y, head: [["Meal", "Recommendation"]],
      body: dietRows, headStyles: { fillColor: amber, fontSize: 9 }, bodyStyles: { fontSize: 9 },
      margin: { left: 15, right: 15 }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  addList("Treatments & Medications", result.treatments, [99, 102, 241]);
  addList("Lifestyle Changes", result.lifestyle_changes, [59, 130, 246]);
  addList("Emergency Warning Signs", result.emergency_signs, red);

  // ── Specialist ─────────────────────────────────────────────────────────────
  if (result.specialist) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(239, 246, 255); doc.roundedRect(15, y, W - 30, 20, 3, 3, "F");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`Recommended: ${result.specialist.type}  |  Urgency: ${result.specialist.urgency}`, 20, y + 12);
    y += 28;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text("⚠ For educational purposes only. Consult a qualified doctor for medical decisions.", W / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    doc.text(`Page ${i}/${pages} • MediSense AI`, W - 15, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }

  doc.save(`MediSense_Report_${Date.now()}.pdf`);
}
