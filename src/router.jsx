import React from 'react';
import {BrowserRouter as Router, Route, Redirect} from 'react-router-dom';
import Index from './pages/index';
import Mynft from './pages/mynft';
import Auction from './pages/auction';
import Myauc from './pages/myauc';


const PageRouter = () => {
    return (
        <Router>
            <Route path="/" exact render={() => <Redirect to="/index" />}/>
            <Route path='/index' component={Index} />
            <Route path='/mynft' component={Mynft} />
            <Route path='/auction' component={Auction} />
            <Route path='/myauc' component={Myauc} />
        </Router>
    );
}

export default PageRouter;