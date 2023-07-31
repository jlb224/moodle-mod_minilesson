<?php

namespace mod_minilesson\local\importform;

/**
 * Helper.
 *
 * @package mod_minilesson
 * @author  Justin Hunt
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * Helper class.
 *
 * @package mod_minilesson
 * @author  Justin Hunt
 */
class baseimportform extends \moodleform {

   public function definition() {
        $mform = $this->_form;


       $choices = \csv_import_reader::get_delimiter_list();
       $mform->addElement('select', 'delimiter_name', get_string('csvdelimiter', 'tool_uploaduser'), $choices);
       if (array_key_exists('cfg', $choices)) {
           $mform->setDefault('delimiter_name', 'cfg');
       } else if (get_string('listsep', 'langconfig') == ';') {
           $mform->setDefault('delimiter_name', 'semicolon');
       } else {
           $mform->setDefault('delimiter_name', 'comma');
       }

       $choices = \core_text::get_encodings();
       $mform->addElement('select', 'encoding', get_string('encoding', 'tool_uploaduser'), $choices);
       $mform->setDefault('encoding', 'UTF-8');

       $file_options = array();
       $file_options['accepted_types'] = array('.csv', '.txt');
       $mform->addElement('filepicker', 'importfile', get_string('file'), 'size="40"', $file_options);
       $mform->addRule('importfile', null, 'required');

        $this->add_action_buttons(false);
    }

}
