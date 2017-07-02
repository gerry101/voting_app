var mongoose = require('mongoose');

var pollSchema = new mongoose.Schema({
   author: {
     id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
     },
     username: String
   },
   title: {
       type: String,
       unique: true
   },
   options: [
       {
           name: String,
           vote: Number
       }
   ],
   ip: [
       {
           ip: String
       }
   ]
});

module.exports = mongoose.model('Poll', pollSchema);