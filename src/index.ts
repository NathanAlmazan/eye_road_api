import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import webpush from 'web-push';
import * as redis from 'redis';

// database client
import client from './client';

// routes
import footages from './footages';
import violations from './violations';

// initialize express app
const app = express();
const port = 4000 || process.env.PORT

// redis
export const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});

const redisConnect = async () => {
    await redisClient.connect();
}

// initialize web push
const publicVapidKey = 'BMs4UAwpUebe4BJNVh2ZmdSyDHsEkqJTKlBDzOk2ADwTj8rdWVsdrYdgeUIxt-3KJLjYcCPLChLb7v_mcC4fvSE';
const privateVapidKey = 'ueFCBTa4fH1wep-HwpeoZK16MclOLXFtMJpq2NMD7K0';

//setting vapid keys details
webpush.setVapidDetails('mailto:eyeroad.nat911.com', publicVapidKey, privateVapidKey);

// initialize middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/footages', footages);
app.use('/violations', violations);

//subscribe route
app.post('/subscribe', async (req, res) => {
    // get push subscription object from the request
    const subscription = req.body;

    const sub = JSON.stringify(subscription);

    const subscribed = await client.traffic_monitoring_subscribedofficers.findFirst({
        where: {
            subscription: sub
        }
    })

    if (!subscribed) {
        await client.traffic_monitoring_subscribedofficers.create({
            data: {
                subscription: sub,
                created: new Date()
            }
        })
    }

    // send status 201 for the request
    res.status(201).json({
        message: 'User Subscribed.'
    })
})

app.listen(port, () => {
    console.log('Listening on port ' + port);

    redisConnect()
        .then(() => console.log('Redis Connected.'))
        .catch(err => console.log(err));

}).on('error', (err: Error) => {
    console.log('Server Error', err.message);
})

