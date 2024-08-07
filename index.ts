import express from 'express';
import morgan from 'morgan';
import router from './routes/index';

const app = express();

const PORT = process.env.PORT || 3000;

app.use('/public', express.static('public'));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(morgan('dev'));

app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
