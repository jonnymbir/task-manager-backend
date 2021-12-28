const sgMail = require('@sendgrid/mail');

const sendgridAPIKey = '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';

sgMail.setApiKey(sendgridAPIKey);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jkmbir@gmail.com',
        subject: 'Welcome to the App',
        text: `Welcome to the app, ${name} I hope this one actually gets to you now!!!.`,
    }).catch((e)=> console.log(e))
}

module.exports = {
    sendWelcomeEmail
};

    // sgMail.send({
    //     to: 'jonnymbir@gmail.com',
    //     from: 'jkmbir@gmail.com',
    //     subject: 'This is my first Task Manager',
    //     text: 'I hope this one actually gets to you now!!!.',
    //     html: '<strong>I hope this one actually gets to you now!!!</strong>'
    // }).catch((e)=> console.log(e))
