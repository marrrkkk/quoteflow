type QuoteSentOwnerNotificationTemplateInput = {
  businessName: string;
  customerName: string;
  customerEmail: string;
  quoteNumber: string;
  title: string;
  dashboardUrl: string;
  publicQuoteUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderQuoteSentOwnerNotificationEmail({
  businessName,
  customerName,
  customerEmail,
  quoteNumber,
  title,
  dashboardUrl,
  publicQuoteUrl,
}: QuoteSentOwnerNotificationTemplateInput) {
  const subject = `${quoteNumber} sent to ${customerName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
      <p style="margin: 0 0 18px;">${escapeHtml(businessName)} just sent a quote to the customer.</p>
      <div style="border: 1px solid #d9deeb; border-radius: 18px; background: #ffffff; padding: 18px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px;"><strong>Quote:</strong> ${escapeHtml(quoteNumber)} · ${escapeHtml(title)}</p>
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
        <p style="margin: 0;"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      </div>
      <p style="margin: 0 0 16px;">
        <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; margin-right: 12px; padding: 12px 18px; border-radius: 999px; background: #172033; color: #ffffff; text-decoration: none; font-weight: 600;">
          Open quote in dashboard
        </a>
        <a href="${escapeHtml(publicQuoteUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; border: 1px solid #d9deeb; color: #172033; text-decoration: none; font-weight: 600;">
          Open customer view
        </a>
      </p>
    </div>
  `;
  const text = [
    `${businessName} just sent a quote to the customer.`,
    "",
    `Quote: ${quoteNumber} - ${title}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    "",
    `Dashboard: ${dashboardUrl}`,
    `Customer view: ${publicQuoteUrl}`,
  ].join("\n");

  return {
    subject,
    html,
    text,
  };
}
