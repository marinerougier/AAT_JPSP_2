/// LICENCE -----------------------------------------------------------------------------
//
// Copyright 2018 - Cédric Batailler
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be included in all copies
// or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// OVERVIEW -----------------------------------------------------------------------------
//
// TODO:
// 
// dirty hack to lock scrolling ---------------------------------------------------------
// note that jquery needs to be loaded.
$('body').css({ 'overflow': 'hidden' });
$(document).bind('scroll', function () {
  window.scrollTo(0, 0);
});

// safari & ie exclusion ----------------------------------------------------------------
var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var is_ie = /*@cc_on!@*/false || !!document.documentMode;

var is_compatible = !(is_safari || is_ie);


if (!is_compatible) {

  var safari_exclusion = {
    type: "html-keyboard-response",
    stimulus:
      "<p>Sorry, this study is not compatible with your browser.</p>" +
      "<p>Please try again with a compatible browser (e.g., Chrome or Firefox).</p>",
    choices: jsPsych.NO_KEYS
  };

  var timeline_safari = [];

  timeline_safari.push(safari_exclusion);
  jsPsych.init({ timeline: timeline_safari });

}

// firebase initialization ---------------------------------------------------------------
var firebase_config = {
  apiKey: "AIzaSyBwDr8n-RNCbBOk1lKIxw7AFgslXGcnQzM",
  databaseURL: "https://aatjpsp2.firebaseio.com/"
};

firebase.initializeApp(firebase_config);
var database = firebase.database();

// id variables
var prolificID = jsPsych.data.getURLVariable("prolificID");
if(prolificID == null) {prolificID = "999";}

var id = jsPsych.randomization.randomID(15)

// Preload images
var preloadimages = [];

// connection status ---------------------------------------------------------------------
// This section ensure that we don't lose data. Anytime the 
// client is disconnected, an alert appears onscreen
var connectedRef = firebase.database().ref(".info/connected");
var connection = firebase.database().ref("VAAST_NewExpe2_JPSP/" + id + "/")
var dialog = undefined;
var first_connection = true;

connectedRef.on("value", function (snap) {
  if (snap.val() === true) {
    connection
      .push()
      .set({
        status: "connection",
        timestamp: firebase.database.ServerValue.TIMESTAMP
      })

    connection
      .push()
      .onDisconnect()
      .set({
        status: "disconnection",
        timestamp: firebase.database.ServerValue.TIMESTAMP
      })

    if (!first_connection) {
      dialog.modal('hide');
    }
    first_connection = false;
  } else {
    if (!first_connection) {
      dialog = bootbox.dialog({
        title: 'Connection lost',
        message: '<p><i class="fa fa-spin fa-spinner"></i> Please wait while we try to reconnect.</p>',
        closeButton: false
      });
    }
  }
});

// counter variables
var vaast_trial_n = 1;
var browser_events_n = 1;

// Variable input -----------------------------------------------------------------------
// Variable used to define experimental condition : approached color and group associated with the color

// Expe (training) vs. control (cat. task) condition 
var training_cond = jsPsych.randomization.sampleWithoutReplacement(["AAT","cont"], 1)[0];
//var training_cond = jsPsych.randomization.sampleWithoutReplacement(["cont"], 1)[0];

// for the AAT condition, randomization of approach/avoidance (for the blue vs. yellow group)
var AAT_cond = jsPsych.randomization.sampleWithoutReplacement(["approach_blue", "approach_yellow"], 1)[0];

// for the control condition, randomization of the E vs. I key (for the blue vs. yellow group)
var control_cond = jsPsych.randomization.sampleWithoutReplacement(["blue_s", "blue_f"], 1)[0];

// group associated with the yellow or blue color
var ColorGroup   = jsPsych.randomization.sampleWithoutReplacement(["G1Y", "G1B"], 1)[0];

// cursor helper functions
var hide_cursor = function () {
  document.querySelector('head').insertAdjacentHTML('beforeend', '<style id="cursor-toggle"> html { cursor: none; } </style>');
}
var show_cursor = function () {
  document.querySelector('#cursor-toggle').remove();
}

var hiding_cursor = {
  type: 'call-function',
  func: hide_cursor
}

var showing_cursor = {
  type: 'call-function',
  func: show_cursor
}

// Preload images in the VAAST 
// Preload faces
var faces = [
      "stimuli/Face19_B.png",
      "stimuli/Face28_B.png",
      "stimuli/Face55_B.png",
      "stimuli/Face95_B.png",
      "stimuli/Face104_B.png",
      "stimuli/Face115_B.png",
      "stimuli/Face119_B.png",
      "stimuli/Face142_B.png",
      "stimuli/Face10_J.png",
      "stimuli/Face16_J.png",
      "stimuli/Face17_J.png",
      "stimuli/Face45_J.png",
      "stimuli/Face85_J.png",
      "stimuli/Face103_J.png",
      "stimuli/Face116_J.png",
      "stimuli/Face132_J.png",
      "stimuli/Face19_J.png",
      "stimuli/Face28_J.png",
      "stimuli/Face55_J.png",
      "stimuli/Face95_J.png",
      "stimuli/Face104_J.png",
      "stimuli/Face115_J.png",
      "stimuli/Face119_J.png",
      "stimuli/Face142_J.png",
      "stimuli/Face10_B.png",
      "stimuli/Face16_B.png",
      "stimuli/Face17_B.png",
      "stimuli/Face45_B.png",
      "stimuli/Face85_B.png",
      "stimuli/Face103_B.png",
      "stimuli/Face116_B.png",
      "stimuli/Face119_B_Example.png",
      "stimuli/Face95_J_Example.png"
];

preloadimages.push(faces);

// VAAST --------------------------------------------------------------------------------
// VAAST variables ----------------------------------------------------------------------

var movement_blue     = undefined;
var movement_yellow   = undefined;
var group_to_approach = undefined;
var group_to_avoid    = undefined;

switch (training_cond) {
  case "cont":
    {if (control_cond == "blue_s"){
    movement_blue = "approach";
    movement_yellow = "avoidance";
    group_to_approach = "blue";
    group_to_avoid    = "yellow";
    } else if (control_cond == "blue_f"){
    movement_blue = "avoidance";
    movement_yellow = "approach";
    group_to_approach = "yellow";
    group_to_avoid    = "blue";
    }};
    break;

  case "AAT":
    {if (AAT_cond == "approach_blue"){
    movement_blue = "approach";
    movement_yellow = "avoidance";
    group_to_approach = "blue";
    group_to_avoid    = "yellow";
    } else if (AAT_cond == "approach_yellow"){
    movement_blue = "avoidance";
    movement_yellow = "approach";
    group_to_approach = "yellow";
    group_to_avoid    = "blue";
    }};
    break;
}

// VAAST stimuli ------------------------------------------------------------------------
// vaast image stimuli ------------------------------------------------------------------

var vaast_stim_training_G1Y = [
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face19_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face28_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face55_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face95_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face104_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face115_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face119_B.png'},
  {movement: movement_blue, group: "blue", stimulus: 'stimuli/Face142_B.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face10_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face16_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face17_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face45_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face85_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face103_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face116_J.png'},
  {movement: movement_yellow,  group: "yellow",  stimulus: 'stimuli/Face132_J.png'}
]

var vaast_stim_training_G1B = [
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face19_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face28_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face55_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face95_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face104_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face115_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face119_J.png'},
  {movement: movement_yellow, group: "yellow", stimulus: 'stimuli/Face142_J.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face10_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face16_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face17_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face45_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face85_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face103_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face116_B.png'},
  {movement: movement_blue, group: "blue",  stimulus: 'stimuli/Face132_B.png'}
]

var vaast_stim_training    = undefined;
switch (ColorGroup) {
case "G1Y":
    vaast_stim_training    = vaast_stim_training_G1Y;
    break;

  case "G1B":
    vaast_stim_training    = vaast_stim_training_G1B;
    break;
}


// vaast background images --------------------------------------------------------------,

var background = [
  "background/1.jpg",
  "background/2.jpg",
  "background/3.jpg",
  "background/4.jpg",
  "background/5.jpg",
  "background/6.jpg",
  "background/7.jpg"
];


// vaast stimuli sizes -------------------------------------------------------------------

var stim_sizes = [
  34,
  38,
  42,
  46,
  52,
  60,
  70
];

var resize_factor = 7;
var image_sizes = stim_sizes.map(function (x) { return x * resize_factor; });

// Helper functions ---------------------------------------------------------------------
// next_position():
// Compute next position as function of current position and correct movement. Because
// participant have to press the correct response key, it always shows the correct
// position.
var next_position_training = function () {
  var current_position = jsPsych.data.getLastTrialData().values()[0].position;
  var current_movement = jsPsych.data.getLastTrialData().values()[0].movement;
  var position = current_position;

  if (current_movement == "approach") {
    position = position + 1;
  }

  if (current_movement == "avoidance") {
    position = position - 1;
  }

  return (position)
}

// Saving blocks ------------------------------------------------------------------------
// Every function here send the data to keen.io. Because data sent is different according
// to trial type, there are differents function definition.

// init ---------------------------------------------------------------------------------
var saving_id = function () {
  database
    .ref("participant_id_AAT_JPSP/")
    .push()
    .set({
      id: id,
      prolificID: prolificID,
      training_cond : training_cond,
      AAT_cond : AAT_cond,
      control_cond : control_cond,
      ColorGroup: ColorGroup,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    })
}

// vaast trial --------------------------------------------------------------------------
var saving_vaast_trial = function () {
  database
    .ref("vaast_trial_AAT_JPSP/").
    push()
    .set({
      id: id,
      prolificID: prolificID,
      training_cond : training_cond,
      AAT_cond : AAT_cond,
      control_cond : control_cond,   
      ColorGroup: ColorGroup,   
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      vaast_trial_data: jsPsych.data.get().last(4).json()
    })
}


// demographic logging ------------------------------------------------------------------

var saving_browser_events = function (completion) {
  database
    .ref("browser_event_AAT_JPSP/")
    .push()
    .set({
      id: id,
      prolificID: prolificID,
      training_cond : training_cond,
      AAT_cond : AAT_cond,
      control_cond : control_cond,
      ColorGroup: ColorGroup,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      completion: completion,
      event_data: jsPsych.data.getInteractionData().json()
    })
}


// saving blocks ------------------------------------------------------------------------
var save_id = {
  type: 'call-function',
  func: saving_id
}

var save_vaast_trial = {
  type: 'call-function',
  func: saving_vaast_trial
}

// EXPERIMENT ---------------------------------------------------------------------------
// Switching to fullscreen --------------------------------------------------------------
var fullscreen_trial = {
  type: 'fullscreen',
  message: 'To start the study, please switch to fullscreen </br></br>',
  button_label: 'Switch to fullscreen',
  fullscreen_mode: true
}


// VAAST --------------------------------------------------------------------------------

var Gene_Instr = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Study on face categorization</h1>" +
    "<br>" +
    "<p class='instructions'> We are interested in the way people categorize " +
    "others as a function of their face. </p>" +
    "<p class='instructions'>In this study, you will have to " +
    "perform two categorization tasks: " +
    "<br>" +
    "- Task 1: The Video Game task (approx. 13 min)" +
    "<br>" +
    "- Task 2: The recognition task (approx. 15 min)" +
    "<br>" +
    "<br>" +
    "To finish, you will have to answer a few questions (approx. 1 min). </p>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

// vaast cond instructions

var vaast_instructions_1_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>This task is much like a video game. You will be " +
    "in a virtual environment in which you will be able to move forward or to move backward. "+
    "The environment in which you will move is displayed below. </p>" +
    "<br>" +
    "<img src = 'media/vaast-background.png'>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_2_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>A series of faces will be displayed in this environment and " +
    "your task is to categorize them as fast as possible. <br>" +
    "<p class='instructions'>These faces have been deliberately blurred. Here are " +
    "two examples of faces that will be displayed: <br><br>" +
    "<center><img src = 'stimuli/Face119_B_Example.png'>" +
    "                              " +
    "<img src = 'stimuli/Face95_J_Example.png'></center>" +
    "<br>" +
    "<p class='instructions'>Your task is to move forward or to move backward " +
    "as a function of the background color (i.e., blue or yellow) of these images. "+
    "More specific instructions will follow. <br><br>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_2_bis_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>To move forward or backward, use the following keys of your keyboard:" +
    "<br>" +
    "<br>" +
    "<img src = 'media/keyboard-vaastt.png'>" +
    "<br>" +
    "<br></p>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_3_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>At the beginning of each trial, you will see the 'O' symbol. " +
    "This symbol indicates that you have to press the START key (namely, the <b>D key</b>) to start the trial. </p>" +
    "<p class='instructions'>Then, you will see a fixation cross (+) at the center of the screen, followed by a face. </p>" +
    "<p class='instructions'>As a function of the background color (blue or yellow) of the face, your task is to move forward or backward by pressing the the MOVE FORWARD key (namely, the <b>E key</b>) "+
    "or the MOVE BACKWARD key (namely, the <b>C key</b>) as fast as possible. After the key press, the face will disappear and you will have to " +
    "press again the START key (D key). " +
    "<p class='instructions'>Please <u>use only the index finger</u> of your favorite hand for all these actions. </p>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};


var vaast_instructions_4_vaast = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>More precisely, you have to: " +
    "<ul class='instructions'>" +
    "<li><strong>APPROACH faces with a " + group_to_approach + " background </strong></li>" +
    "<strong>by pressing the MOVE FORWARD key (namely, the E key) </strong>" +
    "<br>" +
    "<br>" +
    "<li><strong>AVOID faces with a " + group_to_avoid + " background </strong></li>" +
    "<strong>by pressing the the MOVE BACKWARD key (namely, the C key)</strong>" +
    "</ul>" +
    "<p class='instructions'>Please read carefully and make sure that you memorize the instructions above. </p>" +
    "<p class='instructions'><strong>Also, note that is it EXTREMELY IMPORTANT that you try to be as fast and accurate as you can. </strong>" +
    "A red cross will appear if your response is incorrect. </p>" +
    "<br>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>ENTER</strong> to " +
    "start the task.</p>",
  choices: [13]
};

// control cond instructions

var vaast_instructions_1_cont = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>This task is much like a video game. You will be " +
    "in a virtual environment as the one displayed below. </p>" +
    "<br>" +
    "<img src = 'media/vaast-background.png'>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_2_cont = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>A series of faces will be displayed in this environment and " +
    "your task is to categorize them as fast as possible. <br>" +
    "<p class='instructions'>These faces have been deliberately blurred. Here are " +
    "two examples of faces that will be displayed: <br><br>" +
    "<center><img src = 'stimuli/Face119_B_Example.png'>" +
    "                              " +
    "<img src = 'stimuli/Face95_J_Example.png'></center>" +
    "<br>" +
    "<p class='instructions'>Your task is to categorize the faces (by pressing the S key or the F key of your keyboard) " +
    "as a function of the background color (i.e., blue or yellow) of these images. "+
    "More specific instructions will follow. <br><br>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_3_cont = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>At the beginning of each trial, you will see the 'O' symbol. " +
    "This symbol indicates that you have to press the START key (namely, the <b>D key</b>) to start the trial. </p>" +
    "<p class='instructions'>Then, you will see a fixation cross (+) at the center of the screen, followed by a face. </p>" +
    "<p class='instructions'>As a function of the background color (blue or yellow) of the face, your task is to <b>press the S key or the F key</b> as fast as you can. "+
    "After the key press, the face will disappear and you will have to press again the START key (D key). " +
    "<p class='instructions'>Please <u>use only the index finger</u> of your favorite hand for all these actions. </p>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " continue.</p>",
  choices: [32]
};

var vaast_instructions_4_cont = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'> Task 1: Video Game task</h1>" +
    "<p class='instructions'>More precisely, you have to: " +
    "<ul class='instructions'>" +
    "<li><strong>Press the S key for faces with a " + group_to_approach + " background </strong></li>" +
    "<li><strong>Press the F key for faces with a " + group_to_avoid + " background </strong></li>" +
    "</ul>" +
    "<p class='instructions'>Please read carefully and make sure that you memorize the instructions above. </p>" +
    "<p class='instructions'><strong>Also, note that is it EXTREMELY IMPORTANT that you try to be as fast and accurate as you can. </strong>" +
    "A red cross will appear if your response is incorrect. </p>" +
    "<br>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>ENTER</strong> to " +
    "start the task.</p>",
  choices: [13]
};


var vaast_instructions_end = {
  type: "html-keyboard-response",
  stimulus:
    "<p class='instructions'>The Video Game task (task 1) is completed. " +
    "Now, you have to perform the Recognition Task (task 2). </p>" +
    "<br>" +
    "<p class = 'continue-instructions'>Press <strong>space</strong> to" +
    " begin Task 2.</p>",
  choices: [32]
};

// Creating a trial for the VAAST cond ---------------------------------------------------------------------
// Note: vaast_start trial is a dirty hack which uses a regular vaast trial. The correct
// movement is approach and the key corresponding to approach is "h", thus making the
// participant press "h" to start the trial. 

var vaast_start = {
  type: 'vaast-text',
  stimulus: "o",
  position: 3,
  background_images: background,
  font_sizes: stim_sizes,
  approach_key: "d",
  stim_movement: "approach",
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: true,
  display_feedback: true,
  response_ends_trial: true
}

var vaast_fixation = {
  type: 'vaast-fixation',
  fixation: "+",
  font_size: 46,
  position: 3,
  background_images: background
}

var vaast_first_step_training = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: 3,
  background_images: background,
  font_sizes: image_sizes,
  approach_key: "e",
  avoidance_key: "c",
  stim_movement: jsPsych.timelineVariable('movement'),
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: false,
  display_feedback: true,
  feedback_duration: 500,
  response_ends_trial: true
}

var vaast_second_step = {
  type: 'vaast-image',
  position: next_position_training,
  stimulus: jsPsych.timelineVariable('stimulus'),
  background_images: background,
  font_sizes: image_sizes,
  stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 650
}

var vaast_second_step_training = {
  chunk_type: "if",
  timeline: [vaast_second_step],
  conditional_function: function () {
    var data = jsPsych.data.getLastTrialData().values()[0];
    return data.correct;
  }
}


// VAAST training block -----------------------------------------------------------------
var vaast_training = {
  timeline: [
    vaast_start,
    vaast_fixation,
    vaast_first_step_training,
    vaast_second_step_training,
    save_vaast_trial
  ],
  timeline_variables: vaast_stim_training,
  repetitions: 1, //here, put 12 !!!!!
  randomize_order: true,
  data: {
    phase: "training",
    stimulus: jsPsych.timelineVariable('stimulus'),
    movement: jsPsych.timelineVariable('movement'),
    group: jsPsych.timelineVariable('group'),
  }
};


// Creating a trial for the CONTROL cond---------------------------------------------------------------------
var vaast_start_c = {
  type: 'vaast-text',
  stimulus: "o",
  position: 3,
  background_images: background,
  font_sizes: stim_sizes,
  approach_key: "d",
  stim_movement: "approach",
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: true,
  display_feedback: true,
  response_ends_trial: true
}

var vaast_fixation_c = {
  type: 'vaast-fixation',
  fixation: "+",
  font_size: 46,
  position: 3,
  background_images: background
}

var vaast_first_step_training_c = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: 3,
  background_images: background,
  font_sizes: image_sizes,
  approach_key: "s",
  avoidance_key: "f",
  stim_movement: jsPsych.timelineVariable('movement'),
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: false,
  display_feedback: true,
  feedback_duration: 500,
  response_ends_trial: true
}

var vaast_second_step_c = {
  type: 'vaast-image',
  position: 3,
  stimulus: jsPsych.timelineVariable('stimulus'),
  background_images: background,
  font_sizes: image_sizes,
  stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 650
}

var vaast_second_step_training_c = {
  chunk_type: "if",
  timeline: [vaast_second_step_c],
  conditional_function: function () {
    var data = jsPsych.data.getLastTrialData().values()[0];
    return data.correct;
  }
}

// Control training block -----------------------------------------------------------------
var vaast_control = {
  timeline: [
    vaast_start_c,
    vaast_fixation_c,
    vaast_first_step_training_c,
    vaast_second_step_training_c,
    save_vaast_trial
  ],
  timeline_variables: vaast_stim_training,
  repetitions: 1, //here, put 12 !!!!!
  randomize_order: true,
  data: {
    phase: "control",
    stimulus: jsPsych.timelineVariable('stimulus'),
    movement: jsPsych.timelineVariable('movement'),
    group: jsPsych.timelineVariable('group'),
  }
};


// Ici encore tout est dupliqué pour correspondre aux deux blocs de la vaast, les trials
// et les procédures, training compris.
/*
var vaast_first_step_control = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: 3,
  background_images: background,
  font_sizes: image_sizes,
  approach_key: "e",
  avoidance_key: "i",
  stim_movement: jsPsych.timelineVariable('movement'),
  html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
  force_correct_key_press: false,
  display_feedback: true,
  feedback_duration: 500,
  response_ends_trial: true
}

var vaast_second_step_c = {
  type: 'vaast-image',
  stimulus: jsPsych.timelineVariable('stimulus'),
  position: 3,
  background_images: background,
  font_sizes: image_sizes,
  approach_key: "e",
  avoidance_key: "i",
  stim_movement: jsPsych.timelineVariable('movement'),
  response_ends_trial: false,
  trial_duration: 650
}

var vaast_second_step_control = {
  chunk_type: "if",
  timeline: [vaast_second_step_c],
  conditional_function: function () {
    var data = jsPsych.data.getLastTrialData().values()[0];
    return data.correct;
  }
}

// Control training block -----------------------------------------------------------------

var vaast_control = {
  timeline: [
    vaast_fixation,
    vaast_first_step_control,
    vaast_second_step_control,
    save_vaast_trial
  ],
  timeline_variables: vaast_stim_training,
  repetitions: 1, //here, put 5 !!!
  randomize_order: true,
  data: {
    phase: "control",
    stimulus: jsPsych.timelineVariable('stimulus'),
    movement: jsPsych.timelineVariable('movement'),
    group: jsPsych.timelineVariable('group'),
  }
};
*/
// end fullscreen -----------------------------------------------------------------------

var fullscreen_trial_exit = {
  type: 'fullscreen',
  fullscreen_mode: false
}


// procedure ----------------------------------------------------------------------------
// Initialize timeline ------------------------------------------------------------------

var timeline = [];

// fullscreen
timeline.push(
  //welcome,
  fullscreen_trial,
  hiding_cursor);

// prolific verification
timeline.push(save_id);

switch(training_cond) {
  case "AAT":
    timeline.push(Gene_Instr,
                  vaast_instructions_1_vaast,
                  vaast_instructions_2_vaast,
                  vaast_instructions_2_bis_vaast,
                  vaast_instructions_3_vaast,
                  vaast_instructions_4_vaast,
                  vaast_training,
                  vaast_instructions_end);
    break;
  case "cont":
    timeline.push(Gene_Instr,
                  vaast_instructions_1_cont,
                  vaast_instructions_2_cont,
                  vaast_instructions_3_cont,
                  vaast_instructions_4_cont,
                  vaast_control,
                  vaast_instructions_end);
    break;
}


timeline.push(showing_cursor);

timeline.push(fullscreen_trial_exit);

// Launch experiment --------------------------------------------------------------------
// preloading ---------------------------------------------------------------------------
// Preloading. For some reason, it appears auto-preloading fails, so using it manually.
// In principle, it should have ended when participants starts VAAST procedure (which)
// contains most of the image that have to be pre-loaded.
var loading_gif = ["media/loading.gif"]
var vaast_instructions_images = ["media/vaast-background.png", "media/keyboard-vaastt.png"];
var vaast_bg_filename = background;

jsPsych.pluginAPI.preloadImages(loading_gif);
jsPsych.pluginAPI.preloadImages(vaast_instructions_images);
jsPsych.pluginAPI.preloadImages(vaast_bg_filename);

// timeline initiaization ---------------------------------------------------------------
https://marinerougier.github.io/Expe6_RC_3appuis/RCmarine2.html


if (is_compatible) {
  jsPsych.init({
    timeline: timeline,
    preload_images: preloadimages,
    max_load_time: 1000 * 500,
    exclusions: {
      min_width: 800,
      min_height: 600,
    },
    on_interaction_data_update: function () {
      saving_browser_events(completion = false);
    },
    on_finish: function () {
      saving_browser_events(completion = true);
      window.location.href = "https://marinerougier.github.io/AAT_JPSP/RC.html?id=" + id + "&prolificID=" + 
      prolificID + "&training_cond=" + training_cond + "&AAT_cond=" + AAT_cond + "&control_cond=" + control_cond 
      + "&ColorGroup=" + ColorGroup;
    }
  });
}


