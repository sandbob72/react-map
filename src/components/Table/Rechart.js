
import React, { Component } from 'react';
import { BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar } from 'recharts';
import Tabletop from 'tabletop';

class Rechart extends Component {
    constructor() {
        super()
        this.state = {
            data: []
        }
    }

    componentDidMount() {
        Tabletop.init({
            key: '1q66ZlEv6Rj8_BT1h7Dw78kTL-ietR6deNufgflj8n3c',
            callback: googleData => {
                this.setState({
                    data: googleData.Sheet2.elements
                })

                console.log('data1: ', googleData)
                console.log('data1 sheet1: ', googleData.Sheet1)
                console.log('data1 sheet2: ', googleData.Sheet2)
            },
            simpleSheet: false
        })
    }

    render() {
        // let data = [{ name: 'a', pv: 12, uv: 15 }]
        const { data } = this.state
        let students = []

        students = data.slice(0, 75)   //รับค่าจาก google sheet ตัดค่าที่ต้องการเก็บ
        let lookup2 = []

        for (var i = 0, len = students.length; i < len; i++) {
            // lookup2 = [ ...lookup2, { province: students[i].Birth_Province, number:0} ] 
            lookup2.push({ province: students[i].Birth_Province, number: students[i].Number_Student_Province }) //ดึงข้อมูลจาก students ไปยัง lookup2
        }

        console.log('lookup2:', lookup2);
        console.log('student', students)

        return (
            <div>
                <BarChart width={730} height={250} data={lookup2}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="province" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="number" fill="#8884d8" />
                    {/* <Bar dataKey="uv" fill="#82ca9d" /> */}
                </BarChart>
            </div>
        );
    }
}

export default Rechart