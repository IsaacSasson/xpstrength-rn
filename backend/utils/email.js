// new Email(user, url).sendWelcome(); .sendPasswordReset() .forgotPassword()

export default class email {
    constructor(user, url) {
        this.to = user.email;
        this.name = user.username;
        this.url = url;
        this.from = 'XP Strength <xpstrength.feedback@gmail.com>';
    }
}