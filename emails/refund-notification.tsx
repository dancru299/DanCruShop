import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type RefundNotificationEmailProps = {
  supportEmail: string;
};

export default function RefundNotificationEmail({
  supportEmail,
}: RefundNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your DanCruShop order has been refunded.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Your order has been refunded</Heading>
          <Text style={text}>
            We've processed a refund for your recent DanCruShop purchase. Access
            to the associated products has been removed from your account.
          </Text>
          <Text style={text}>
            The refund amount will appear in your original payment method within
            5–10 business days depending on your bank.
          </Text>
          <Section style={supportSection}>
            <Text style={mutedText}>
              If you have questions or believe this was a mistake, please contact
              us at{" "}
              <a href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </a>
              .
            </Text>
          </Section>
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
  margin: "0 0 16px",
};

const mutedText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const supportSection = {
  borderLeft: "3px solid #e5e5e5",
  marginTop: "24px",
  paddingLeft: "16px",
};

const link = {
  color: "#171717",
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
