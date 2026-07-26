import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { LabelDetails, LabelTemplate } from "@/types";

interface LabelPdfDocumentProps {
  template: LabelTemplate;
  details: LabelDetails;
  codeImage: string;
  secondaryImage?: string | null;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "Helvetica",
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 400,
    marginBottom: 24,
  },
  section: {
    marginBottom: 14,
  },
  separatedSection: {
    borderTop: "1px solid #d8d8d8",
    marginTop: 4,
    marginBottom: 14,
    paddingTop: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  inlineHeadingLabel: {
    fontWeight: 700,
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 3,
    paddingLeft: 28,
  },
  bullet: {
    fontSize: 12,
    width: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 1.25,
  },
  link: {
    color: "#1c68c9",
    fontSize: 12,
    paddingLeft: 44,
  },
  copy: {
    fontSize: 12,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  codeWrap: {
    alignItems: "center",
    minHeight: 96,
    justifyContent: "center",
  },
  barcodeWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 116,
  },
  barcodeFrame: {
    alignItems: "center",
    border: "1px dashed #777777",
    justifyContent: "center",
    minHeight: 104,
    paddingHorizontal: 22,
    paddingVertical: 8,
    width: 360,
  },
  qrImage: {
    width: 88,
    height: 88,
    objectFit: "contain",
  },
  barcodeImage: {
    width: 318,
    height: 92,
    objectFit: "contain",
  },
  labelImage: {
    width: "100%",
    maxHeight: 380,
    objectFit: "contain",
  },

  table: {
    border: "1px solid #cfd2d4",
    marginTop: 4,
  },
  row: {
    display: "flex",
    flexDirection: "row",
  },
  headerCell: {
    backgroundColor: "#f0f1f1",
    borderBottom: "1px solid #cfd2d4",
    fontSize: 12,
    fontWeight: 700,
    padding: 10,
  },
  itemCell: {
    flex: 1,
  },
  qtyCell: {
    width: 88,
    textAlign: "right",
  },
  bodyCell: {
    fontSize: 12,
    lineHeight: 1.25,
    padding: 10,
  },
  footer: {
    borderTop: "1px solid #e5e5e5",
    color: "#666666",
    fontSize: 9,
    lineHeight: 1.3,
    marginTop: 16,
    paddingTop: 8,
  },
});

function codeImageStyle(template: LabelTemplate) {
  if (template.codeType === "label") {
    return styles.labelImage;
  }

  if (template.codeType === "barcode") {
    return styles.barcodeImage;
  }

  return styles.qrImage;
}

export function LabelPdfDocument({
  template,
  details,
  codeImage,
  secondaryImage,
}: LabelPdfDocumentProps) {
  const orderRef = details.orderRef.trim();

  return (
    <Document title="Return Label">
      <Page size={[595, 842]} style={styles.page}>
        <Text style={styles.title}>Your Return Label</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Additional Instructions for mailing your package</Text>
          {template.instructions.map((instruction, index) => (
            <View key={instruction}>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>{instruction}</Text>
              </View>
              {index === (template.dropoffLinkInstructionIndex ?? 0) && template.dropoffLink ? (
                <Text style={styles.link}>{template.dropoffLink}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{template.codeLabel}</Text>
          <Text style={styles.copy}>{template.validityCopy}</Text>
          {template.codeType === "barcode" ? (
            <View style={styles.barcodeWrap}>
              <View style={styles.barcodeFrame}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={codeImage} style={styles.barcodeImage} />
              </View>
            </View>
          ) : (
            <View style={styles.codeWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={codeImage} style={codeImageStyle(template)} />
            </View>
          )}
        </View>

        {template.secondaryCodeLabel ? (
          <View style={styles.separatedSection}>
            <Text style={styles.copy}>
              <Text style={styles.inlineHeadingLabel}>{template.secondaryCodeLabel}: </Text>
              {template.secondaryCodeHelp}
            </Text>
            {secondaryImage ? (
              <View style={styles.codeWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={secondaryImage} style={styles.barcodeImage} />
              </View>
            ) : null}
          </View>
        ) : null}

        {template.showItemTable ? (
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.headerCell, styles.itemCell]}>Item Descriptions</Text>
              <Text style={[styles.headerCell, styles.qtyCell]}>Quantity</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.bodyCell, styles.itemCell]}>
                {details.itemName.trim() || "Item description"}
              </Text>
              <Text style={[styles.bodyCell, styles.qtyCell]}>{details.quantity.trim() || "1"}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {template.dropoffNote}
          {orderRef ? `  Ref: ${orderRef}` : ""}
        </Text>
      </Page>
    </Document>
  );
}
