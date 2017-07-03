var Poll       = require('../models/poll'),
    middleware = require('../middleware'),
    express    = require('express'),
    router     = express.Router();

router.get('/polls', function(req, res) { 
   if (req.query.title) {
       const regex = new RegExp(escapeRegex(req.query.title), 'gi');
       Poll.find({'title': regex}, function(err, polls) {
          if(err) {
              req.flash('An error seems to have occurred');
              res.redirect('/');
          } else {
              res.render('polls', {polls: polls});
          }
       }); 
   } else {
       res.render('landing', {'info': 'Please search below to view relevant results'});
   }
});

router.get('/poll/new', middleware.isLoggedIn, function(req, res) {
   res.render('polls/new'); 
});

router.post('/poll', middleware.isLoggedIn, function(req, res) {
   var pushData = [];
   req.body.option.forEach(function(option) {
           pushData.push({name: option, vote: 1}); 
       });
        var pollData = {
            title: req.body.title,
            options: pushData,
        }
        Poll.create(pollData, function(err, poll) {
           if(err) {
               req.flash('error', 'That poll name is already in use');
               return res.redirect('/poll/new');
           } else {
               poll.author.id = req.user._id;
               poll.author.username = req.user.username;
               req.user.polls.push(poll);
               req.user.save();
               poll.save();
               req.flash('success', 'Your poll can be shared through: ' + 'https://' + req.headers.host + '/poll/show/' + poll._id);
               res.redirect('/poll/show/' + poll._id);
           }
        });
});

router.get('/poll/show/:id', function(req, res) {
   var ip;
    if(req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0];
    } else if(req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    
   Poll.findById(req.params.id).populate('options').populate('ip').exec(function(err, poll) {
      if(err) {
          req.flash('error', 'An error seems to have ocured');
          return res.redirect('/');
      }
       var isVoted = false;
       if(poll.ip.length > 0) {
           for(var i = 0; i < poll.ip.length; i++) {
               if(poll.ip[i].ip === ip) {
                   isVoted = true;
               }
           }
       }
       res.render('polls/show', {poll: poll, isVoted: isVoted, 'success': 'This poll can be shared through: ' + 'https://' + req.headers.host + '/poll/show/' + poll._id});
   });
});

router.put('/poll/:id/:option/:vote', function(req, res) {
   var ip;
    if(req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0];
    } else if(req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    
   var newVote = Number(req.params.vote) + 1;
   Poll.update({'options.name': req.params.option}, {'$set': {
    'options.$.vote': newVote
}}, function(err) {
       if(err) {
           req.flash('error', 'An error seems to have ocured');
           res.redirect('/poll/show/' + req.params.id);
       }
       Poll.findOne({_id: req.params.id}, function(err, poll) {
          if(err) {
              req.flash('error', 'An error seems to have ocured');
              res.redirect('/poll/show/' + req.params.id);
          } else {
              poll.ip.push({ip: ip});
              poll.save();
          }
       });
       req.flash('success', 'Thank you for voting for ' + req.params.option);
       res.redirect('/poll/show/' + req.params.id);
   });
});

router.delete('/poll/:id', function(req, res) {
   Poll.findByIdAndRemove(req.params.id, function(err) {
      if(err) {
          req.flash('error', 'An error seems to have ocured');
          res.redirect('/profile');
      }
       res.redirect('/profile');
   }); 
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;