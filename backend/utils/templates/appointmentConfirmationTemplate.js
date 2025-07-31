module.exports = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmation - {{hospitalName}}</title>
    <style>
        body { font-family: 'Arial', sans-serif; background: #f4f4f4; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #00569B; color: #fff; text-align: center; padding: 30px 20px; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .content p { margin-bottom: 15px; }
        .details { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .details h2 { color: #00569B; font-size: 22px; margin-bottom: 20px; }
        .info { display: table; width: 100%; }
        .info-item { display: table-row; }
        .label, .value { display: table-cell; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .label { font-weight: bold; color: #555; width: 40%; }
        .value { color: #333; }
        .footer { background: #f8f9fa; text-align: center; padding: 30px; color: #666; border-top: 2px solid #eee; }
        .footer p { margin: 5px 0; font-size: 14px; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; margin: 0; border-radius: 0; padding: 0; }
            .header { padding: 15px; }
            .header h1 { font-size: 20px; margin-bottom: 8px; }
            .content { padding: 15px; }
            .details { padding: 12px; margin: 15px 0; border-radius: 6px; }
            .details h2 { font-size: 18px; margin-bottom: 15px; }
            .info { display: block; }
            .info-item { display: block; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
            .label, .value { display: block; width: 100%; padding: 3px 0; }
            .label { font-size: 12px; color: #666; margin-bottom: 2px; }
            .value { font-size: 14px; font-weight: 500; }
            .footer { padding: 15px; }
            .footer p { font-size: 12px; margin: 3px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Confirmation</h1>
            <p>Thank you for booking your appointment with {{hospitalName}}</p>
        </div>
        <div class="content">
            <p>Dear {{patientName}},</p>
            <p>Your appointment has been successfully scheduled. Here are your appointment details:</p>
            <div class="details">
                <h2>Appointment Information</h2>
                <div class="info">
                    <div class="info-item">
                        <div class="label">Date</div>
                        <div class="value">{{date}}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Time</div>
                        <div class="value">{{time}}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Type</div>
                        <div class="value">{{type}}</div>
                    </div>
                    {{#if doctorName}}
                    <div class="info-item">
                        <div class="label">Doctor</div>
                        <div class="value">{{doctorName}}</div>
                    </div>
                    {{/if}}
                    {{#if department}}
                    <div class="info-item">
                        <div class="label">Department</div>
                        <div class="value">{{department}}</div>
                    </div>
                    {{/if}}
                    {{#if notes}}
                    <div class="info-item">
                        <div class="label">Notes</div>
                        <div class="value">{{notes}}</div>
                    </div>
                    {{/if}}
                </div>
            </div>
            <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
            </div>
        <div class="footer">
            <p><strong>{{hospitalName}}</strong></p>
            <p>{{hospitalAddress}}</p>
            <p>📞 {{hospitalPhone}} | ✉️ {{hospitalEmail}}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;