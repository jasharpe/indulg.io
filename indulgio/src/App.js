import React, { Component } from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import './App.css';
var createReactClass = require('create-react-class');

// Initialize Firebase.
var config = {
  apiKey: "AIzaSyD_5IGB67w3U4pJvYi6gkFQV_pQSWcM0sc",
  authDomain: "indulgio-8faae.firebaseapp.com",
  databaseURL: "https://indulgio-8faae.firebaseio.com",
  storageBucket: "",
};
firebase.initializeApp(config);

const Timer = createReactClass({
  mixins: [ReactFireMixin],

  componentWillMount() {
    this.ref = firebase.database().ref(this.props.refStr);
    this.bindAsObject(this.ref, "timer");
  },

  editTitle(e) {
    this.setState({
      editTitle: true
    });
    this.setEditTitleFocus = true;
  },

  editTitleKeyPress(e) {
    if (e.key === 'Enter') {
      this.submitTitle();
    }
  },

  submitTitle() {
    this.setState({
      editTitle: false
    });
    firebase.database().ref(this.props.refStr).update({
      title: this.titleInput.value
    });
  },

  componentDidUpdate() {
    if (this.setEditTitleFocus) {
      this.titleInput.value = this.state.timer.title;
      this.titleInput.focus();
      this.titleInput.selectionStart = this.titleInput.selectionEnd = this.titleInput.value.length;
      this.setEditTitleFocus = false;
    }
  },

  play(e) {
    e.preventDefault();
    this.ref.update({
      paused: false,
      startTime: Date.now(),
      realTotalTime: this.state.timer.pausedSecsLeft,
      pausedSecsLeft: null
    });
  },

  pause(e) {
    e.preventDefault();
    var secsLeft = this.state.timer.realTotalTime - Math.ceil((Date.now() - this.state.timer.startTime) / 1000);
    if (secsLeft < 0) {
      secsLeft = 0;
    }
    this.ref.update({
      paused: true,
      pausedSecsLeft: secsLeft
    });
  },

  repeat(e) {
    e.preventDefault();
    this.ref.parent.push({
      title: this.state.timer.title,
      startTime: Date.now(),
      totalTime: this.state.timer.totalTime,
      realTotalTime: this.state.timer.totalTime,
    });
  },

  remove(e) {
    e.preventDefault();
    this.ref.remove();
  },

  render() {
    var secsLeft;
    if (this.state.timer.paused) {
      secsLeft = this.state.timer.pausedSecsLeft;
    } else {
      secsLeft = this.state.timer.realTotalTime - Math.ceil((Date.now() - this.state.timer.startTime) / 1000);
      if (secsLeft < 0) {
        secsLeft = 0;
      }
    }

    var seconds = secsLeft % 60;
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    var minutes = (secsLeft - seconds) / 60;
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    var totalSeconds = this.state.timer.totalTime % 60;
    if (totalSeconds < 10) {
      totalSeconds = '0' + totalSeconds;
    }
    var totalMinutes = (this.state.timer.totalTime - totalSeconds) / 60;
    if (totalMinutes < 10) {
      totalMinutes = '0' + totalMinutes;
    }

    var progress = 100 * (1 - secsLeft / this.state.timer.totalTime);

    var title;
    if (this.state.editTitle) {
      title = <input onBlur={this.submitTitle} onKeyPress={this.editTitleKeyPress} className="EditTitle" placeholder="Label" type="text" ref={(input) => { this.titleInput = input; }} />;
    } else if (this.state.timer.title) {
      title = <span onClick={this.editTitle} className="Title">{this.state.timer.title}</span>;
    } else {
      title = <span onClick={this.editTitle} className="Title NoTitle">Label</span>;
    }

    var progressBarClasses;
    if (this.props.done) {
      progressBarClasses = "progress-bar progress-bar-danger";
    } else if (this.state.timer.paused) {
      progressBarClasses = "progress-bar progress-bar-success";
    } else {
      progressBarClasses = "progress-bar progress-bar-success progress-bar-striped active";
    }

    let buttons = [];

    if (!this.props.done) {
      if (this.state.timer.paused) {
        buttons.push(
          <button key="play" onClick={this.play} className="LeftButton btn btn-success btn-sm">
            <span className="glyphicon glyphicon-play" aria-hidden="true"></span>
          </button>
        );
      } else {
        buttons.push(
          <button key="pause" onClick={this.pause} className="LeftButton btn btn-primary btn-sm">
            <span className="glyphicon glyphicon-pause" aria-hidden="true"></span>
          </button>
        );
      }
    }

    buttons.push(
      <button key="repeat" onClick={this.repeat} className="LeftButton btn btn-success btn-sm">
        <span className="glyphicon glyphicon-repeat" aria-hidden="true"></span>
      </button>
    );

    if (this.state.timer.paused || this.props.done) {
      buttons.push(
        <button key="delete" onClick={this.remove} className="pull-right btn btn-danger btn-sm">
          <span className="glyphicon glyphicon-stop" aria-hidden="true"></span>
        </button>
      );
    }

    return (
      <div style={{position: "relative"}}>
        <h2 className="Clock">
          
          {title}
          {minutes}:{seconds}
          <span className="Total">/ {totalMinutes}:{totalSeconds}</span>
        </h2>
        <div className="progress">
          <div className={progressBarClasses} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{width: progress + "%"}}>
            <span className="sr-only">{progress}% Complete (success)</span>
          </div>
        </div>
        {buttons}
        <div style={{clear: "both"}} />
      </div>
    );
  }
});

var Timers = createReactClass({
  mixins: [ReactFireMixin],

  componentWillMount() {
    this.ref = firebase.database().ref("timers/" + this.props.uid);
    this.bindAsArray(this.ref, "timers");
  },

  componentDidMount() {
    var update = function() {
      this.forceUpdate();
      setTimeout(update, 100);
    }.bind(this);
    setTimeout(update, 100);
  },

  createTimer(e) {
    e.preventDefault();
    var seconds = document.getElementById("seconds").value;
    var minutes = document.getElementById("minutes").value;
    var hours = document.getElementById("hours").value;
    var time = seconds + 60 * minutes + 3600 * hours;
    this.ref.push({
      title: '',
      startTime: Date.now(),
      totalTime: time,
      realTotalTime: time
    });
  },

  render() {
    let rows = [];
    let doneRows = [];
    this.state.timers.forEach(function(timer) {
      if (!timer.paused && Date.now() - timer.startTime > timer.realTotalTime * 1000) {
        doneRows.push(
          <div key={timer['.key']}>
            <Timer done="true" refStr={"timers/" + this.props.uid + "/" + timer['.key']} />
            <hr />
          </div>);
      } else {
        rows.push(
          <div key={timer['.key']}>
            <Timer refStr={"timers/" + this.props.uid + "/" + timer['.key']} />
            <hr />
          </div>);
      }
    }.bind(this));
    rows.reverse();
    doneRows.reverse();
    return (
      <div className="App">
        <h1>Timers</h1>
        {rows}
        <form onSubmit={this.createTimer} className="form-inline">
          <input className="form-control Time" type="text" placeholder="hh" id="hours" /> : <input className="form-control Time" type="text" placeholder="mm" id="minutes" /> : <input className="form-control Time" type="text" placeholder="ss" id="seconds" />
          <button type="submit" className="Add btn btn-success"><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
        </form>
        <hr />
        <h3 className="Completed">Completed</h3>
        {doneRows}
      </div>
    );
  }
});

var SignIn = createReactClass({
  onGoogle: function(e) {
    e.preventDefault();
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/plus.login');
    firebase.auth().signInWithRedirect(provider);
  },
  onAnon: function(e) {
    e.preventDefault();
    firebase.auth().signInAnonymously().catch(function(error) {
      console.error(error);
    });
  },
  render: function() {
    return (
      <div className="App">
        <h2>Sign in?</h2>
        <div className="btn-toolbar">
          <button onClick={this.onGoogle} type="button" className="btn btn-success">Sign in with Google</button>
          <button onClick={this.onAnon} type="button" className="btn btn-danger">Sign in anonymously</button>
        </div>
      </div>
    );
  }
});

class App extends Component {
  componentWillMount() {
    firebase.auth().onAuthStateChanged(function(user) {
      this.setState({
        user: user,
      });
    }.bind(this));
  }

  render() {
    if (this.state && this.state.user) {
      // User is signed in.
      var user = this.state.user;
      var uid = user.uid;
      return <Timers uid={uid} isAnon={user.isAnonymous} name={user.displayName} email={user.email} />;
    } else {
      // User is signed out.
      return <SignIn />;
    }
  }
}

export default App;
