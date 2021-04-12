define(['jquery', 'core/log', 'mod_minilesson/definitions', 'mod_minilesson/pollyhelper',
    'mod_minilesson/cloudpoodllloader','mod_minilesson/ttrecorder'], function($, log, def, polly,cloudpoodll, ttrecorder) {
  "use strict"; // jshint ;_;

  /*
  This file is to manage the quiz stage
   */

  log.debug('MiniLesson Multiaudio: initialising');

  return {

      passmark: 85,
      playing: false,

    //for making multiple instances
      clone: function () {
          return $.extend(true, {}, this);
     },

    init: function(index, itemdata, quizhelper) {
      this.prepare_audio(itemdata);
      this.register_events(index, itemdata, quizhelper);
      this.init_components(index, itemdata, quizhelper);
    },
    next_question: function(percent) {
      var self = this;
      var stepdata = {};
      stepdata.index = self.index;
      stepdata.hasgrade = true;
      stepdata.totalitems = 1;
      stepdata.correctitems = percent>0?1:0;
      stepdata.grade = percent;
      self.quizhelper.do_next(stepdata);
    },
    register_events: function(index, itemdata, quizhelper) {
      
      var self = this;
      var theplayer = $("#" + itemdata.uniqueid + "_player");
      self.index = index;
      self.quizhelper = quizhelper;
      
      $("#" + itemdata.uniqueid + "_container .minilesson_nextbutton").on('click', function(e) {
        self.next_question(0);
      });
      
      $("#" + itemdata.uniqueid + "_container .minilesson_mc_response").on('click', function(e) {
        //if disabled =>just return (already answered)
          if($("#" + itemdata.uniqueid + "_container .minilesson_mc_response").hasClass('minilesson_mc_disabled')){
            return;
          }

          //audio play requests
          if (!self.playing) {
              var el = this;
              self.playing = true;
              theplayer.attr('src', $(this).attr('data-src'));
              theplayer[0].play();
              theplayer[0].onended = function() {
                  self.playing = false;
              };
          }

          //get selected item index
          //var checked = $(this).data('index');

      });
      
    },//end of register events

    prepare_audio: function(itemdata) {
         // debugger;
          $.each(itemdata.sentences, function(index, sentence) {
              polly.fetch_polly_url(sentence.displaysentence, itemdata.voiceoption, itemdata.usevoice).then(function(audiourl) {
                  $("#" + itemdata.uniqueid + "_option" + (index+1)).attr("data-src", audiourl);
              });
          });
    },

    process_accepted_response: function(itemdata, checked){

        //disable the answers, cos its answered
        $("#" + itemdata.uniqueid + "_container .minilesson_mc_response").addClass('minilesson_mc_disabled');

        //reveal answers
        $("#" + itemdata.uniqueid + "_container .minilesson_mc_wrong").show();
        $("#" + itemdata.uniqueid + "_option" + itemdata.correctanswer + " .minilesson_mc_wrong").hide();
        $("#" + itemdata.uniqueid + "_option" + itemdata.correctanswer + " .minilesson_mc_right").show();

        //highlight selected answers
        $("#" + itemdata.uniqueid + "_option" + checked).addClass('minilesson_mc_selected');


        var percent = checked == itemdata.correctanswer ? 100 : 0;

        return percent;

    },

    init_components: function(index, itemdata, quizhelper) {
        var app= this;
        var correcttext = $("#" + itemdata.uniqueid + "_option" + itemdata.correctanswer).text();
        var allresponses = $("#" + itemdata.uniqueid + "_container .minilesson_mc_response");
        var cleanincorrecttexts=[];
        for(var i=0;i<allresponses.length;i++){
            if(i+1==itemdata.correctanswer) {
                //to make life simple for ourselves we add an empty string entry in incorrecttexts at the correct answer index
                //NB index of item in DOM is 1 based , so we need to mess with +1's
                cleanincorrecttexts[i]='';
            }else{
                cleanincorrecttexts[i]=quizhelper.cleanText(allresponses[i].textContent);
            }
        }

        var cleancorrecttext = quizhelper.cleanText(correcttext);

        var theCallback = function(message) {

            switch (message.type) {
                case 'recording':

                    break;

                case 'speech':
                    log.debug("speech at multiaudio");
                    var speechtext = message.capturedspeech;
                    var cleanspeechtext = quizhelper.cleanText(speechtext);
                    var spoken = cleanspeechtext;
                    log.debug('speechtext:',speechtext);
                    log.debug('spoken:',spoken);
                    log.debug('correct:',cleancorrecttext);
                    //Similarity check by character matching
                    var similarity = quizhelper.similarity(spoken, cleancorrecttext);
                    log.debug('JS similarity: ' + spoken + ':' + cleancorrecttext + ':' + similarity);

                    //Similarity check by direct-match/acceptable-mistranscription
                    if (similarity >= app.passmark ||
                        app.wordsDoMatch(quizhelper, cleanspeechtext, cleancorrecttext)) {
                        log.debug('local correct match:' + ':' + spoken + ':' + cleancorrecttext);
                        var percent = app.process_accepted_response(itemdata, itemdata.correctanswer);

                        //proceed to next question
                        setTimeout(function() {
                            $(".minilesson_nextbutton").prop("disabled", false);
                            app.next_question(percent);
                        }, 2000);

                        return;
                    }else{
                        for(var x=0;x<cleanincorrecttexts.length;x++){
                            //if this is the correct answer index, just move on
                            if(cleanincorrecttexts[x]===''){continue;}
                            var similar = quizhelper.similarity(spoken, cleanincorrecttexts[x]);
                            log.debug('JS similarity: ' + spoken + ':' + cleanincorrecttexts[x] + ':' + similar);
                            if (similar >= app.passmark ||
                                app.wordsDoMatch(quizhelper, cleanspeechtext, cleanincorrecttexts[x])) {

                              //proceed to next question
                                var percent = app.process_accepted_response(itemdata, x+1);
                                $(".minilesson_nextbutton").prop("disabled", true);

                                //proceed to next question
                                setTimeout(function() {
                                    $(".minilesson_nextbutton").prop("disabled", false);
                                    app.next_question(percent);
                                }, 2000);
                            }//end of if similarity
                        }//end of for x
                    }

                    //Similarity check by phonetics(ajax)
                    quizhelper.checkByPhonetic(spoken, cleancorrecttext, itemdata.language).then(function(similarity) {
                        if (similarity === false) {
                            return $.Deferred().reject();
                        } else {
                            log.debug('PHP similarity: ' + spoken + ':' + cleancorrecttext + ':' + similarity);
                            if (similarity >= app.passmark) {
                                var percent = app.process_accepted_response(itemdata, itemdata.correctanswer);

                                //proceed to next question
                                $(".minilesson_nextbutton").prop("disabled", true);
                                setTimeout(function() {
                                    $(".minilesson_nextbutton").prop("disabled", false);
                                    app.next_question(percent);
                                }, 2000);
                            }
                        } //end of if check_by_phonetic result
                    }); //end of check by phonetic

            } //end of switch message type
        };



        if(quizhelper.use_ttrecorder()) {
            //init tt recorder
            var opts = {};
            opts.uniqueid = itemdata.uniqueid;
            opts.callback = theCallback;
            ttrecorder.clone().init(opts);
        }else{
            //init cloudpoodll push recorder
            cloudpoodll.init('minilesson-recorder-multiaudio-' + itemdata.id, theCallback);
        }

    }, //end of init components

    wordsDoMatch: function(quizhelper, phraseheard, currentphrase) {
        //lets lower case everything
        phraseheard = quizhelper.cleanText(phraseheard);
        currentphrase = quizhelper.cleanText(currentphrase);
        if (phraseheard == currentphrase) {
            return true;
        }
        return false;
    },
  };
});