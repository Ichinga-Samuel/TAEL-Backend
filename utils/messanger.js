const nodemailer = require('nodemailer');
const inlinecss = require('nodemailer-juice');
const pug = require('pug')
const { EMAIL_USERNAME, EMAIL_PORT, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_ADDRESS} = process.env;

exports.emailService = class Email{
    constructor(sender=EMAIL_ADDRESS){
        this.from = sender
        this.paths = {activation: "./public/pug/activation_email.pug", pwd_reset: "./public/pug/pwd_reset_email.pug"}
    }
    transporter() {
        return(nodemailer.createTransport({
            host:EMAIL_HOST,
            port: EMAIL_PORT,
            auth: {
                user: EMAIL_USERNAME,
                pass: EMAIL_PASSWORD
            }
        }));
    }

    async send(body){
        let path = this.paths[[body.type]]
        let html = pug.renderFile(path, body.data)
        const mailOptions = {
            from: this.from,
            to: body.recipient,
            subject: body.subject,
            html: html,
            priority: "high",
        };

        // Create a transport and send email
        this.transporter().use('compile', inlinecss());
        let res = await this.transporter().sendMail(mailOptions);
        return res.accepted
    }
}
