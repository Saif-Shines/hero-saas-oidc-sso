import express from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { ScalekitClient } from '@scalekit-sdk/node';

const app = express();
const router = express.Router();

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

var scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL || '',
  process.env.SCALEKIT_CLIENT_ID || '',
  process.env.SCALEKIT_CLIENT_SECRET || ''
);

const organizationID = 'org_22533691091715588';
const redirectURI = 'http://localhost:3000/callback';

router.get('/', (req, res) => {
  if (session.isloggedin) {
    res.render('loggedin.ejs', {
      profile: session.profile,
      firstName: session.firstName,
    });
  }
  res.render('index.ejs', { title: 'Home' });
});

router.post('/login', (req, res) => {
  let login_type = req.body.login_method;

  var options = {};
  if (login_type === 'saml') {
    options['organizationId'] = organizationID;
  } else {
    options['provider'] = login_type;
  }
  try {
    console.log('options:', options);
    const authorizationUrl = scalekit.getAuthorizationUrl(redirectURI, {
      ...options,
    });
    console.log('authorizationUrl:', authorizationUrl);
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Error redirecting to authorization URL:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/callback', async (req, res) => {
  let errorMessage;
  const { code, error } = req.query;
  // console.log('req.query:\n', JSON.stringify(req.query, null, 2));

  if (error) {
    errorMessage = `Redirect callback error: ${error}`;
  } else {
    const profile = await scalekit.authenticateWithCode(code, redirectURI);
    const decodedDetails = jwt.decode(profile.idToken);
    res.status(200).json(decodedDetails);

    session.email = decodedDetails.email;
    session.isloggedin = true;
  }

  if (errorMessage) {
    console.error('Unable to exchange code for token:', errorMessage);
    res.status(500).send(errorMessage);
  }
});

export default router;
