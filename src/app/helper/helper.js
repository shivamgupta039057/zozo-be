
const nodemailer = require("nodemailer");


const emailSend = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Visuti Career" <${process.env.SMTP_EMAIL}>`,
      // from: process.env.SMTP_EMAIL,
      to,
      subject,
      html,
      attachDataUrls: true,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("infoinfoinfoinfoinfo" , info);
    
    
    return { success: true };

  } catch (error) {
    console.error("Email Error: ", error);

    return { success: false, error };
  }
};


const MobileOtpSend = async (mobile, otp) => {
  try {
      const txtmsg = encodeURIComponent(`Your login OTP for Visuti Career is ${otp}. Do not share it with anyone.`);
      // const txtmsg = encodeURIComponent(`Hi, Your OTP Verification Code is ${otp}. Do not share it with anyone. --Dash`);

      if (process.env.OTPENV === "LOCAL") {
        console.log(`[LOCAL MODE] Simulated sending OTP: ${otp} to ${mobile}`);
        return { status: "success", message: "Simulated SMS sent" };
      }
      
      const authkey = process.env.SMS_AUTH_KEY; // Your authentication key
      const sender = process.env.SMS_SENDER_ID; // Your sender ID
      const route = process.env.SMS_ROUTE; // Your SMS route
      const DLT_TE_ID = process.env.SMS_DLT_TE_ID
      // const authKey = process.env.RAZORPAY_KEY_SECRET

      // const url = `https://control.msg91.com/api/sendhttp.php?authkey=${authkey}&mobiles=91${mobile}&message=${txtmsg}&sender=${sender}&route=${route}`;
      const url = `https://control.msg91.com/api/sendhttp.php?authkey=${authkey}&mobiles=91${mobile}&message=${txtmsg}&sender=${sender}&route=${route}&country=91&DLT_TE_ID=${DLT_TE_ID}`;

      const response = await axios.get(url);
      console.log("SMS Response:", response.data);
      return response.data;
  } catch (error) {
      console.error("SMS Error:", error);
      throw new Error("Failed to send SMS");
  }
};



module.exports = {
  emailSend,
  MobileOtpSend,
};