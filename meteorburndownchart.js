function toInput (event) {
      var span = $(event.target).closest('span')
      var label = span.find('label:first')
      var input = span.find("input:first")
      label.css("visibility", "hidden")
      input.css("visibility", "inherit")
      input.focus()
}

function toLabel(event) {
      var span = $(event.target).closest('span')
      var label = span.find('label:first')
      var input = span.find("input:first")
      input.css("visibility", "hidden")
      label.css("visibility", "inherit")

      return input;
}

function allToLabels(event) {
      var formspan = $(event.target).closest('span').parent().parent().parent().parent()
      var spans = formspan.find('span')
      spans.each( function (){
        var label = $(this).find('label:first')
        var input = $(this).find("input:first")
        if (input.attr('id') === 'newtask'){
          //do nothing
        } else {
          input.css("visibility", "hidden")
        }
        label.css("visibility", "inherit")
      })
}

function updateRemainingTime(input, taskid) {
      var newRemainingTime = Number(input.val() || 0)
      check(newRemainingTime, Number)
      Tasks.update(taskid, {$set: {remainingTime: newRemainingTime}});
      input.val('')
}

function updateName(input, taskid) {
      var newName = String(input.val() || "Task")
      check(newName, String)
      Tasks.update(taskid, {$set: {name: newName}});
      input.val('')
}

function updatePerson(input, taskid) {
      var newPerson = String(input.val() || "?")
      check(newPerson, String)
      Tasks.update(taskid, {$set: {person: newPerson}});
      input.val('')
}

function drag(ev)
{
  ev.dataTransfer.setData("Text",ev.target.id);
}

function allowDrop(ev)
{
  ev.preventDefault();
}

function findPartialTaskDiv(element) {
  var parent = $(element).closest('div').parent()
  if (parent.attr("class") === "taskslist"){
     return element;
  }
  return parent;
}

function drop(ev, newStatus)
{
  console.log('drop! on inProgress');
  console.log('drop on '+newStatus+', targetClass='+$(ev.currentTarget).attr("class"));
  ev.preventDefault();
  var taskid=ev.dataTransfer.getData("Text");
  console.log(taskid)
  Tasks.update(taskid, {$set: {status: newStatus}});
 
  if (newStatus === "done") {
    Tasks.update(taskid, {$set: {remainingTime: 0}});
  }

  findPartialTaskDiv($(ev.currentTarget)).removeClass('dragover');
}


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

Tasks = new Meteor.Collection("tasks");

if (Meteor.isClient) {
  Template.taskslist.tasks = function () {
    return Tasks.find({}, {sort: {person: 1, name: 1, remainingTime: -1}});
  };

Template.taskslist.events({

  'dragover' : function(e, t) {
    e.preventDefault(); 
    findPartialTaskDiv($(e.currentTarget)).addClass('dragover');
    allowDrop(e);
  },

  'dragstart' : function(e, t) {
   drag(e);
  },

  'dragleave' : function(e, t) {
    findPartialTaskDiv($(e.currentTarget)).removeClass('dragover');
  },

  'drop #wait' : function(e, t) {
    e.preventDefault();
    drop(e, "wait");
  },

  'drop #inprogress' : function(e, t) {
    e.preventDefault();
    drop(e, "inProgress");
  },

  'drop #done' : function(e, t) {
    e.preventDefault();
    drop(e, "done");
  }

});

  Template.taskslist.events(okCancelEvents(
  '#newtask',
  {
    ok: function (text, evt) {
      Tasks.insert({name: text, remainingTime: 0, person: '?', status: 'wait'});
      evt.target.value = '';
    }
  }));

  Template.task.events({
    'click .remainingTimeSpan': function (event) {
      allToLabels(event);
      toInput(event);
    },

    'keypress .remainingTimeSpan': function (event) {
      if(event.which == 13) {
        var input = toLabel(event);

        updateRemainingTime(input, this._id);
      }
    },

    'click .nameSpan': function (event) {
      allToLabels(event);
      toInput(event);
    },

    'keypress .nameSpan': function (event) {
      if(event.which == 13) {
        var input = toLabel(event);

        updateName(input, this._id);
      }
    },

    'click .personSpan': function (event) {
      allToLabels(event);
      toInput(event);
    },

    'keypress .personSpan': function (event) {
      if(event.which == 13) {
        var input = toLabel(event);

        updatePerson(input, this._id);
      }
    }
  });

  Template.taskslist.statusIs = function (status) {
    return this.status === status;
  };

  Template.task.selected = function () {
    return Session.equals("selected_task", this._id) ? "selected" : '';
  };

  Template.task.events({
    'focus': function () {
      Session.set("selected_task", this._id);
    }
  });

  /*Template.task.events({
    'blur': function () {
      Session.set("selected_task", '');
    }
  });*/
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Tasks.find().count() === 0) {
      var names = ["Create first version",
                   "Add selection",
                   "Set remaining time",
                   "Create new task",
                   "Create new task",
                   "Ordering",
                   "Burn down chart"];
      for (var i = 0; i < names.length; i++)
        Tasks.insert({name: names[i], remainingTime: Math.floor(Random.fraction()*10)*5, status: "wait", person: "John"});
    }
  });
}
