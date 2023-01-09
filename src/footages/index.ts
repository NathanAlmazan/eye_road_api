import express from 'express';
// database client
import client from '../client';

const route = express.Router();

const baseUrl = 'https://eyeroad.nat911.com/media/'

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

route.get('/:id', async (req, res) => {
    const record = await client.traffic_monitoring_trafficfootage.findUnique({
        where: {
            id: parseInt(req.params.id)
        }
    })

    if (record === null) return res.status(404).json({ message: 'No record found' });

    return res.status(200).json({
        id: record.id.toString(),
        name: record.file_name,
        url: baseUrl + record.file_data,
        created: record.file_created.toISOString()
    });
})

export default route;