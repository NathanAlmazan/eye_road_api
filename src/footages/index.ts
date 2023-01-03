import express from 'express';
// database client
import client from '../client';

const route = express.Router();

const baseUrl = 'http://eyeroad.nat911.com/media/'

route.get('/', async (req, res) => {
    const result = await client.traffic_monitoring_trafficfootage.findMany({
        orderBy: {
            file_created: 'desc'
        }
    })

    return res.status(200).json(result.map(r => ({
        id: r.id.toString(),
        name: r.file_name,
        url: baseUrl + r.file_data,
        created: r.file_created.toISOString()
    })));
})

export default route;