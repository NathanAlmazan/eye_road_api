import express from 'express';
// database client
import client from '../client';
import webpush from 'web-push';
import { redisClient } from '..';

const route = express.Router();

const baseUrl = 'http://eyeroad.nat911.com/media/'

interface RecordedViolations {
    id: string;
    footage: string;
    type?: string;
    plate: string;
    created?: Date;
    fee: number;
}

route.get('/', async (req, res) => {
    const violations = await client.traffic_monitoring_recordedviolations.findMany({
        orderBy: {
            violation_date: 'desc'
        }
    })

    const records = await client.traffic_monitoring_filedviolations.findMany();
    const recordIds = records.map(record => parseInt(record.id.toString()))

    const result = violations.filter(violation => !recordIds.includes(parseInt(violation.id.toString())));

    // await redisClient.connect();
    // const totalViolations = await redisClient.get('violations');

    // if (totalViolations && parseInt(totalViolations) > violations.length) {
    //     // create payload: specified the details of the push notification
    //     const payload = JSON.stringify({
    //         title: violations[0].violation_type + 'Violation Detected',
    //         body: 'Go to eyeroad.nat911.com to see details', 
    //         icon: 'https://res.cloudinary.com/ddpqji6uq/image/upload/v1672565207/eye_road_wc5mwp.webp'
    //     });

    //     // pass the object into sendNotification function and catch any error
    //     const subscribed = await client.traffic_monitoring_subscribedofficers.findMany();

    //     subscribed.forEach(sub => {
    //         webpush.sendNotification(JSON.parse(sub.subscription), payload).catch(err => console.error(err));
    //     })
    // }

    // await redisClient.set('violations', violations.length.toString());

    return res.status(200).json(result.map(res => ({
        id: res.id.toString(),
        type: res.violation_type,
        date: res.violation_date.toISOString(),
        url: baseUrl + res.violation_data
    })))
})

route.get('/records', async (req, res) => {
    const recorded = await client.traffic_monitoring_filedviolations.findMany();
    const results: RecordedViolations[] = [];
    
    for (let i = 0; i < recorded.length; i++) {
        const footage = await client.traffic_monitoring_recordedviolations.findUnique({
            where: {
                id: recorded[i].violation_record
            }
        })

        results.push({
            id: recorded[i].id.toString(),
            footage: baseUrl + footage?.violation_data,
            plate: recorded[i].vehicle_plate_number,
            type: footage?.violation_type,
            created: footage?.violation_date,
            fee: recorded[i].violation_fee
        })
    }

    return res.status(200).json(results);
})

route.get('/record/:id', async (req, res) => {
    const id: number = parseInt(req.params.id);

    const result = await client.traffic_monitoring_recordedviolations.findUnique({
        where: {
            id: id,
        }
    })

    if (result && result.violation_footage) {
        const footage = await client.traffic_monitoring_trafficfootage.findUnique({
            where: {
                id: result.violation_footage
            }
        })
    
        return res.status(200).json({
            id: result.id.toString(),
            url: baseUrl + result.violation_data,
            type: result.violation_type,
            created: result.violation_date,
            timestamp: result.violation_mark,
            footage: baseUrl + footage?.file_data
        });
    }

    return res.status(404).json({ message: 'Record not found.' });
})

route.get('/notification', async (req, res) => {
    // create payload: specified the details of the push notification
    await redisClient.set('violations', 2);
    const totalViolations = await redisClient.get('violations');

    const payload = JSON.stringify({
        title: totalViolations + ' Violation Detected',
        body: 'Go to eyeroad.nat911.com to see details', 
        icon: 'https://res.cloudinary.com/ddpqji6uq/image/upload/v1672565207/eye_road_wc5mwp.webp'
    });

    // pass the object into sendNotification function and catch any error
    const subscribed = await client.traffic_monitoring_subscribedofficers.findMany();

    subscribed.forEach(sub => {
        webpush.sendNotification(JSON.parse(sub.subscription), payload).catch(err => console.error(err));
    })

    return res.status(201).json({ message: "Sent notification successfully." })
})

export default route;