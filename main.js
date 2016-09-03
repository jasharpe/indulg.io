var Controls = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function() {
  },
  onUse: function(e) {
    e.preventDefault();
    var indulgences = firebase.database().ref("indulgences/" + this.props.uid);
    indulgences.once('value', function(snap) {
      if (snap.val() === null) {
        return;
      }
      var factor = snap.val().factor;
      var elapsed = new Date().getTime() - snap.val().last_updated;
      var currentCount = snap.val().count + elapsed / (factor * 1000);
      indulgences.child('count').set(currentCount - 1);
      indulgences.child('last_updated').set(new Date().getTime());
    });
  },
  onEarn: function(e) {
    e.preventDefault();
    var indulgences = firebase.database().ref("indulgences/" + this.props.uid);
    indulgences.once('value', function(snap) {
      if (snap.val() === null) {
        return;
      }
      var factor = snap.val().factor;
      var elapsed = new Date().getTime() - snap.val().last_updated;
      var currentCount = snap.val().count + elapsed / (factor * 1000);
      indulgences.child('count').set(currentCount + 1);
      indulgences.child('last_updated').set(new Date().getTime())
    });
  },
  render: function() {
    return (
      <div className="btn-toolbar">
        <button onClick={this.onUse} type="button" className="btn btn-danger">I used an indulgence</button>
        <button onClick={this.onEarn} type="button" className="btn btn-success">I earned an indulgence</button>
      </div>
    );
  }
});

var ProgressMeter = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function() {
    var ref = firebase.database().ref("indulgences/" + this.props.uid);
    this.bindAsObject(ref, "indulgences");
  },
  componentDidMount: function() {
    var update = function() {
      this.forceUpdate();
      setTimeout(update, 1000);
    }.bind(this);
    setTimeout(update, 1000);
  },
  componentWillUpdate: function() {
    var indulgences = firebase.database().ref("indulgences/" + this.props.uid);
    indulgences.once('value', function(snap) {
      if (!snap.val() ||
          snap.val().count === undefined ||
          snap.val().last_updated === undefined ||
          snap.val().factor === undefined) {
        indulgences.child('count').set(0);
        indulgences.child('last_updated').set(new Date().getTime());
        indulgences.child('factor').set(24 * 3600);  // 1 per day.
      }
    });
  },
  render: function() {
    if (this.state == null) {
      return <div>Loading...</div>;
    }

    var elapsed = new Date().getTime() - this.state.indulgences.last_updated;
    var currentCount = this.state.indulgences.count + elapsed / (this.state.indulgences.factor * 1000);

    var progress = 100 * (currentCount - Math.floor(currentCount));

    return (
      <div>
        <p>You have {Math.floor(currentCount)} indulgences.</p>
        <p>Working on another (1 per {this.state.indulgences.factor} seconds):</p>
        <div className="progress">
          <div className="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{width: progress + "%"}}>
            <span className="sr-only">{progress}% Complete (success)</span>
          </div>
        </div>
      </div>
    );
  }
});

var App = React.createClass({
  /*this.firebaseRefs.items.push({
    text: 'hi'
  });*/
  render: function() {
    return (
      <div>
        <h1 className="page-header">indulg.io</h1>
        <ProgressMeter uid={this.props.uid} />
        <Controls uid={this.props.uid} />
      </div>
    );
  }
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    ReactDOM.render(
      <App uid={uid} />,
      document.getElementById('content')
    );
  } else {
    // User is signed out.
    // ...
    firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(error);
      // ...
    });
  }
  // ...
});
