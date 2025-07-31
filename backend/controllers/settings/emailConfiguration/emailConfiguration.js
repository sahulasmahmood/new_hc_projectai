const { PrismaClient } = require('../../../generated/prisma');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

exports.getEmailConfig = async (req, res) => {
  try {
    const config = await prisma.emailConfiguration.findFirst();
    res.json({ success: true, emailConfig: config || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmailConfig = async (req, res) => {
  try {
    const body = req.body;
    const requiredFields = [
      "smtpPort",
      "smtpUsername",
      "smtpPassword",
      "senderEmail",
      "smtpHost",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    let config = await prisma.emailConfiguration.findFirst();
    if (config) {
      config = await prisma.emailConfiguration.update({
        where: { id: config.id },
        data: { ...body, updatedAt: new Date() }
      });
    } else {
      config = await prisma.emailConfiguration.create({ data: body });
    }
    res.json({ success: true, emailConfig: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.testEmailConfig = async (req, res) => {
  try {
    const { testEmail, message } = req.body;
    if (!testEmail || !testEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid test email is required" });
    }
    const config = await prisma.emailConfiguration.findFirst();
    if (!config) {
      return res.status(404).json({ success: false, message: "Email configuration not found" });
    }
    if (!config.smtpHost || !config.smtpPort || !config.smtpUsername || !config.smtpPassword) {
      return res.status(400).json({ success: false, message: "Incomplete SMTP configuration" });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: parseInt(config.smtpPort) === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      tls: { rejectUnauthorized: false, ciphers: "SSLv3" },
      debug: false,
      logger: false,
    });

    try {
      await transporter.verify();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "SMTP authentication failed. Please check your credentials.",
        details: err.message,
      });
    }

    const info = await transporter.sendMail({
      from: config.senderEmail,
      to: testEmail,
      subject: "Test Email",
      text: message || "This is a test email",
    });

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
      details: error.stack,
    });
  }
};