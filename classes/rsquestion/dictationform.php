<?php
/**
 * Created by PhpStorm.
 * User: ishineguy
 * Date: 2018/03/13
 * Time: 19:31
 */

namespace mod_minilesson\rsquestion;

use \mod_minilesson\constants;

class dictationform extends baseform
{

    public $type = constants::TYPE_DICTATION;

    public function custom_definition() {
        //nothing here
        $this->add_static_text('instructions','',get_string('entersentences',constants::M_COMPONENT));
        $this->add_textarearesponse(1,get_string('sentences',constants::M_COMPONENT));
        $this->add_voiceselect(constants::POLLYVOICE,get_string('choosevoice',constants::M_COMPONENT));
    }

}