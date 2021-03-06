var Controls = React.createClass({
  mixins: [ReactFireMixin],
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
      firebase.database().ref("indulgence_list/" + this.props.uid).push({
        type: 'Use',
        time: new Date().getTime(),
        reason: '',
        total: currentCount - 1
      });
    }.bind(this));
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
      indulgences.child('last_updated').set(new Date().getTime());
      firebase.database().ref("indulgence_list/" + this.props.uid).push({
        type: 'Earn',
        time: new Date().getTime(),
        reason: '',
        total: currentCount + 1
      });
    }.bind(this));
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

var UpdateFactor = React.createClass({
  onSubmit: function(e) {
    e.preventDefault();
    var factor = this.state.value;
    if (!$.isNumeric(factor)) {
      console.error(factor + ' is not a number');
      return;
    }
    var factorNumber = parseFloat(factor);
    if (factorNumber < 0) {
      console.error(factorNumber + ' is less than zero');
      return;
    }
    var indulgences = firebase.database().ref("indulgences/" + this.props.uid);
    indulgences.once('value', function(snap) {
      if (snap.val() === null) {
        return;
      }
      var factor = snap.val().factor;
      var elapsed = new Date().getTime() - snap.val().last_updated;
      var currentCount = snap.val().count + elapsed / (factor * 1000);
      indulgences.child('count').set(currentCount);
      indulgences.child('last_updated').set(new Date().getTime());
      indulgences.child('factor').set(factorNumber);
    });
  },
  onChange: function(e) {
    this.setState({value: e.target.value});
  },
  render: function() {
    return (
      <form className="spaced" onSubmit={this.onSubmit}>
        <div className="input-group">
          <input type="text" className="form-control" onChange={this.onChange} placeholder="Seconds per indulgence"/>
          <span className="input-group-btn">
            <input className="btn btn-default" type="submit" value="Set"/>
          </span>
        </div>
      </form>
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
      this.timeout = setTimeout(update, 1000);
    }.bind(this);
    this.timeout = setTimeout(update, 1000);
  },
  componentWillUnmount: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
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
          <div className="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{width: progress + "%"}}>
            <span className="sr-only">{progress}% Complete (success)</span>
          </div>
        </div>
      </div>
    );
  }
});

var List = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function() {
    var ref = firebase.database().ref("indulgence_list/" + this.props.uid);
    this.bindAsArray(ref, "indulgence_list");
  },
  onChange: function(key) {
    return function(e) {
      e.preventDefault();
      firebase.database().ref("indulgence_list/" + this.props.uid + "/" + key + "/reason").set(e.target.value);
    }.bind(this);
  },
  render: function() {
    var rows = [];
    this.state.indulgence_list.forEach(function(indulgence) {
      var timestamp = new Date(indulgence.time).toLocaleTimeString() + ' ' + new Date(indulgence.time).toLocaleDateString();
      rows.push(
          <tr key={indulgence['.key']}>
            <td>{indulgence.type}</td>
            <td>{timestamp}</td>
            <td><input type="text" value={indulgence.reason} onChange={this.onChange(indulgence['.key'])} /></td>
            <td>{Math.floor(indulgence.total)}</td>
          </tr>
      );
    }.bind(this));
    rows.reverse();
    return (
        <table className="table table-condensed table-hover">
          <thead>
            <tr>
              <th>Type</th>
              <th>When</th>
              <th>Reason</th>
              <th>Total After</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
    );
  }
});

var Indulgences = React.createClass({
  render: function() {
    return (
      <div>
        <ProgressMeter uid={this.props.uid} />
        <Controls uid={this.props.uid} />
        <UpdateFactor uid={this.props.uid} />
        <List uid={this.props.uid} />
      </div>
    );
  }
});

var Timer = React.createClass({
  componentWillMount: function() {
    this.setState({time: 1200});
    var update = function() {
      //this.forceUpdate();
      this.setState({time: this.state.time - 1});
      setTimeout(update, 1000);
    }.bind(this);
    setTimeout(update, 1000);
  },
  render: function() {
    var seconds = this.state.time % 60;
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    var minutes = (this.state.time - seconds) / 60;
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    var progress = 100 * (1 - this.state.time / 1200);

    return (
      <div>
        <h2>{minutes}:{seconds}</h2>
        <div className="progress">
          <div className="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" style={{width: progress + "%"}}>
            <span className="sr-only">{progress}% Complete (success)</span>
          </div>
        </div>
        
      </div>
    );
  }
});

var App = React.createClass({
  signOut: function(e) {
    e.preventDefault();
    firebase.auth().signOut();
  },
  timer: function(e) {
    e.preventDefault();
    this.setState({page: 'timer'});
  },
  render: function() {
    var page = <Indulgences uid={this.uid} />;
    if (this.state != null && this.state.page == 'timer') {
      page = <Timer />;
    }

    var greeting;
    if (this.props.isAnon) {
      greeting = 'anonymously so your progress might disappear.';
    } else if (this.props.name) {
      greeting = <span>as {this.props.name}.</span>;
    } else {
      greeting = <span>as {this.props.email}.</span>;
    }

    return (
      <div>
        <h1 className="page-header">indulg.io</h1>
        <div>
          <button onClick={this.timer} type="button" className="btn btn-default">Timer</button>
        </div>
        {page}
        <div className='spaced'>
          <div className="signed-in-notice">Signed in {greeting}</div>
          <button onClick={this.signOut} type="button" className="btn btn-default">Sign out</button>
        </div>
      </div>
    );
  },
});

var SignIn = React.createClass({
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
      <div>
        <h1 className="page-header">indulg.io</h1>
        <div className="btn-toolbar">
          <button onClick={this.onGoogle} type="button" className="btn btn-success">Sign in with Google</button>
          <button onClick={this.onAnon} type="button" className="btn btn-danger">Sign in anonymously</button>
        </div>
      </div>
    );
  }
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var uid = user.uid;
    ReactDOM.render(
      <App uid={uid} isAnon={user.isAnonymous} name={user.displayName} email={user.email} />,
      document.getElementById('content')
    );
  } else {
    // User is signed out.
    ReactDOM.render(<SignIn />, document.getElementById('content'));
  }
  // ...
});
