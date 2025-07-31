const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// You will provide the appointmentConfirmationTemplate in the next message
const appointmentConfirmationTemplate = require("./templates/appointmentConfirmationTemplate");
const appointmentCancellationTemplate = require("./templates/appointmentCancellationTemplate");
const appointmentRescheduleTemplate = require("./templates/appointmentRescheduleTemplate");

async function sendAppointmentConfirmationEmail({ to, name, appointmentDetails }) {
  try {
    // Fetch email config from DB (assuming only one config row)
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");

    // Fetch hospital settings
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    // Validate required fields
    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    // Setup nodemailer transport (unchanged)
    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    // Format date
    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    // Merge hospital info into appointmentDetails for template
    const templateData = {
      ...appointmentDetails,
      name,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentConfirmationTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    // Send the email
    const sendResult = await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Confirmation - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    console.log("Appointment email sent:", sendResult);
    return true;
  } catch (error) {
    console.error("Error sending appointment confirmation email:", error);
    return false;
  }
}

async function sendAppointmentCancellationEmail({ to, appointmentDetails }) {
  try {
    // Fetch email config from DB
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");

    // Fetch hospital settings
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    // Validate required fields
    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    // Setup nodemailer transport
    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    // Format date
    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    // Merge hospital info into appointmentDetails for template
    const templateData = {
      ...appointmentDetails,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentCancellationTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    // Send the email
    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Cancellation - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment cancellation email:", error);
    return false;
  }
}

async function sendAppointmentRescheduleEmail({ to, appointmentDetails }) {
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    const templateData = {
      ...appointmentDetails,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    const compiledTemplate = Handlebars.compile(appointmentRescheduleTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Appointment Rescheduled - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment reschedule email:", error);
    return false;
  }
}

// Send appointment reminder email (24 hours before)
async function sendAppointmentReminderEmail({ to, name, appointmentDetails }) {
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    const templateData = {
      ...appointmentDetails,
      name,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    // Simple reminder template
    const reminderTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 Appointment Reminder</h1>
                <p>{{hospitalName}}</p>
            </div>
            <div class="content">
                <h2>Hello {{name}},</h2>
                <p>This is a friendly reminder about your upcoming appointment:</p>
                
                <div class="appointment-details">
                    <h3>📅 Appointment Details</h3>
                    <p><strong>Date:</strong> {{date}}</p>
                    <p><strong>Time:</strong> {{time}}</p>
                    <p><strong>Type:</strong> {{type}}</p>
                    {{#if doctorName}}<p><strong>Doctor:</strong> {{doctorName}}</p>{{/if}}
                    {{#if department}}<p><strong>Department:</strong> {{department}}</p>{{/if}}
                </div>
                
                <p><strong>Please remember to:</strong></p>
                <ul>
                    <li>Arrive 15 minutes early</li>
                    <li>Bring a valid ID and insurance card</li>
                    <li>Bring any relevant medical records</li>
                    <li>Wear a mask if required</li>
                </ul>
                
                <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            </div>
            <div class="footer">
                <p>{{hospitalName}}</p>
                {{#if hospitalAddress}}<p>{{hospitalAddress}}</p>{{/if}}
                {{#if hospitalPhone}}<p>Phone: {{hospitalPhone}}</p>{{/if}}
                <p>&copy; {{currentYear}} {{hospitalName}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const compiledTemplate = Handlebars.compile(reminderTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Reminder: Your appointment tomorrow at ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment reminder email:", error);
    return false;
  }
}

// Send appointment follow-up email
async function sendAppointmentFollowUpEmail({ to, name, appointmentDetails }) {
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) throw new Error("Email configuration not found");
    const hospitalSettings = await prisma.hospitalSettings.findFirst();

    const requiredFields = [
      "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "senderEmail"
    ];
    for (const field of requiredFields) {
      if (!emailConfig[field]) throw new Error(`Missing email configuration: ${field}`);
    }

    const transport = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: parseInt(emailConfig.smtpPort) === 465,
      auth: {
        user: emailConfig.smtpUsername,
        pass: emailConfig.smtpPassword,
      },
      tls: { rejectUnauthorized: false },
    });

    if (appointmentDetails.date) {
      appointmentDetails.date = new Date(appointmentDetails.date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    const templateData = {
      ...appointmentDetails,
      name,
      hospitalName: hospitalSettings?.name || "Hospital",
      hospitalAddress: hospitalSettings?.address || "",
      hospitalPhone: hospitalSettings?.phone || "",
      hospitalEmail: hospitalSettings?.email || "",
      currentYear: new Date().getFullYear(),
    };

    // Simple follow-up template
    const followUpTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Follow-up</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .cta-button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💚 Thank You for Your Visit</h1>
                <p>{{hospitalName}}</p>
            </div>
            <div class="content">
                <h2>Hello {{name}},</h2>
                <p>Thank you for choosing {{hospitalName}} for your healthcare needs. We hope your recent appointment went well.</p>
                
                <div class="appointment-details">
                    <h3>📅 Your Recent Appointment</h3>
                    <p><strong>Date:</strong> {{date}}</p>
                    <p><strong>Time:</strong> {{time}}</p>
                    <p><strong>Type:</strong> {{type}}</p>
                    {{#if doctorName}}<p><strong>Doctor:</strong> {{doctorName}}</p>{{/if}}
                </div>
                
                <h3>📋 Next Steps</h3>
                <ul>
                    <li>Follow any instructions provided during your visit</li>
                    <li>Take medications as prescribed</li>
                    <li>Schedule follow-up appointments if recommended</li>
                    <li>Contact us if you have any questions or concerns</li>
                </ul>
                
                <p><strong>Need to schedule a follow-up?</strong></p>
                <p>Our AI assistant can help you book your next appointment quickly and easily.</p>
                
                <p>We value your feedback! Please let us know about your experience.</p>
            </div>
            <div class="footer">
                <p>{{hospitalName}}</p>
                {{#if hospitalAddress}}<p>{{hospitalAddress}}</p>{{/if}}
                {{#if hospitalPhone}}<p>Phone: {{hospitalPhone}}</p>{{/if}}
                <p>&copy; {{currentYear}} {{hospitalName}}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    const compiledTemplate = Handlebars.compile(followUpTemplate);
    const htmlBody = compiledTemplate(templateData);

    await transport.verify();

    await transport.sendMail({
      from: {
        name: templateData.hospitalName,
        address: emailConfig.senderEmail,
      },
      to,
      subject: `Thank you for your visit - ${templateData.hospitalName}`,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    console.error("Error sending appointment follow-up email:", error);
    return false;
  }
}

module.exports = {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
  sendAppointmentRescheduleEmail,
  sendAppointmentReminderEmail,
  sendAppointmentFollowUpEmail,
};