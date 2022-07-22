import nodemailer from 'nodemailer';

export async function sendMail(to: string, html: string) {
  //   let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'acyi725vber4btku@ethereal.email', // generated ethereal user
      pass: 'vgy3XfmdDWNhkNk7T8', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to,
    subject: 'Change Password ✔', // Subject line
    // text, plain text
    html, //send html in email
  });

  console.log('Message sent: %s', info.messageId);

  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}
