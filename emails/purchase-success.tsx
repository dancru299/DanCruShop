import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type PurchaseSuccessEmailProps = {
  productName: string;
  magicLink: string;
};

export default function PurchaseSuccessEmail({
  productName,
  magicLink,
}: PurchaseSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your DanCruShop purchase is ready.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Your purchase is ready</Heading>
          <Text style={text}>
            Thanks for buying <strong>{productName}</strong>. Your product has
            been unlocked in your DanCruShop dashboard.
          </Text>
          <Section style={buttonSection}>
            <Button href={magicLink} style={button}>
              Open your product
            </Button>
          </Section>
          <Text style={mutedText}>
            This secure link signs you in and takes you to your dashboard. If
            you did not make this purchase, you can ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>DanCruShop</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f6f6",
  color: "#171717",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: "0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  margin: "40px auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  fontSize: "28px",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 24px",
};

const mutedText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0 0",
};

const buttonSection = {
  margin: "28px 0",
};

const button = {
  backgroundColor: "#171717",
  borderRadius: "8px",
  color: "#ffffff",
  display: "block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 22px",
  textAlign: "center" as const,
  textDecoration: "none",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "32px 0 16px",
};

const footer = {
  color: "#737373",
  fontSize: "13px",
  margin: "0",
};
