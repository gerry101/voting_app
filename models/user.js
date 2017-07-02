var passportLocalMongoose = require('passport-local-mongoose'),
    mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
   username: {
       type: String,
       unique: true
   },
   email: {
       type: String,
       unique: true
   },
   password: String,
   polls: [
     {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Poll'
     }
   ],
   resetPasswordToken: String,
   resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);