import React, { Component } from 'react'
import {Button, Menu, Card, Layout, Row, Col, Modal, Form, Image } from 'antd';
import 'antd/dist/antd.css';
import {CarryOutOutlined, AlipayCircleFilled } from '@ant-design/icons'
import ParticlesBg from "particles-bg";
const { Header, Content, Footer } = Layout;

let web3 = require('../initWeb3');
let contract = require('../contract');

class Myauc extends React.Component{

    constructor(props){
        super(props)
        this.state = {
            unfin_list : [],
            fin_list : [],
            my_abort_list: [],   //流拍列表
            my_unfin_list: [],
            cur_account: 0
        }

        this.init_list()
    }


    init_list = async() => {
        try {
            let _fin_list = []
            let _unfin_list = []
            let _my_abort_list = []
            let _my_unfin_list = []
            
            //获取address => single_auction
            let account = await web3.eth.getAccounts();
            console.log('当前帐号：' + account[0])

            //这里严格意义上不严谨，但是以来区别不大，二来想减少前端处理，先这么写
            var now_time=Date.parse(new Date()) / 1000;
            console.log('当前时间'+now_time)


            let _evolve_num = await contract.methods.evolve_num(account[0]).call();
            //for循环遍历，循环体内直接判断当前时间和ddl
            for (let i=0;i<_evolve_num;i++){
                let v = await contract.methods.my_evolve(account[0], i).call();
                console.log('结束与否')
                console.log(v[5])
                console.log('结束时间')
                console.log(v[6])
                if (v[5] == true)   //已经结束的拍卖不再显示
                    continue;
                else{
                    if (v[6] < now_time){
                        let unixTimestamp = new Date(v[6]*1000);
                        // console.log(v[6])
                        v[6] = unixTimestamp.toLocaleString()
                        // console.log("ddl"+v[6])
                        if (v[3] == 0){           //流拍的
                            _my_abort_list.push(v)
                        }else{                 //我胜出的结束拍卖
                            if (v[4] == account[0]){
                                _fin_list.push(v)
                            }
                        }
                    }
                    else{
                        //这里其实可以调用finish_auction，但好像意义不大
                        let unixTimestamp = new Date(v[6]*1000);
                        // console.log(v[6])
                        v[6] = unixTimestamp.toLocaleString()
                        // console.log("ddl"+v[6])
                        if (v[1] == account[0]){  //自己发起的拍卖
                            _my_unfin_list.push(v)
                        }else{  //自己作为竞价者的拍卖
                            _unfin_list.push(v)
                        }
                    }
                }
            }

            this.setState({
                unfin_list: _unfin_list,
                fin_list: _fin_list,
                my_abort_list: _my_abort_list,
                my_unfin_list: _my_unfin_list,
                cur_account: account[0]
            })

            console.log('未完成的')
            console.log(this.state.unfin_list)
            console.log('已完成的')
            console.log(this.state.fin_list)
        }catch(e){
            console.log(e)
        }

    }

    claim = async(idx, money) => {
        console.log('auction number:' + idx)
        console.log('pay:' + money + 'ether')

        try{
            let account = await web3.eth.getAccounts(); 
            console.log('当前帐号:'+account[0])
            //付款
            if (money != 0){
                await contract.methods.pay_for_auction(idx).send({
                    from: account[0],
                    value: web3.utils.toWei(String(money), 'ether') ,
                    gas: '3000000'
                })
            }
            //checkmate
            await contract.methods.checkmate_auction(idx).send({
                from: account[0],
                gas: '3000000'
            })

        }catch(e){
            console.log(e)
        }

        this.init_list()
    }

    go_auction(){
        window.location.href = '/auction';
    }
    go_mynft(){
        window.location.href = '/mynft';
    }
    // go_myauc(){
    //     window.location.href = '/myauc'
    // }




    render(){
        document.title = 'Auction System';
        return (
            <>
            <ParticlesBg type="random" bg={true}/>
            <Layout>
                {/* <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                <div className="logo" />
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
                        <Menu.Item key="1" onClick={()=>this.init_list()}>展示我的所有参与</Menu.Item>
                    </Menu>
                </Header> */}
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
                        <Menu.Item key="1" onClick={()=>this.init_list()}>展示我参与的拍卖</Menu.Item>
                        <Menu.Item key="2" onClick={this.go_mynft}>我的NFT</Menu.Item>
                        <Menu.Item key="3" onClick={this.go_auction}>拍卖市场</Menu.Item>
                    </Menu>
                 </Header>
                <Content className="site-layout" style={{ padding: '0 50px', marginTop: 64 }}>
                    <div className="site-layout-background" style={{ padding: 24, minHeight: 500 }}>
                    <Card title="我发起的尚未结束的拍卖" style={{ width: 1390}}>
                    <Row>
                        <Col span={2}>nft名称</Col>
                        <Col span={3}>nft预览</Col>
                        <Col span={1}>底价</Col>
                        <Col span={2}>当前最高价</Col>
                        <Col span={7}>最高出价人</Col>
                        <Col span={3}>结束时间</Col>
                    </Row>
                    <div><br></br></div>
                    {this.state.my_unfin_list.map((item, idx)=>{
                        return (
                            <div>
                            <Row>
                              <Col span={2}>{item[8]}</Col>
                              <Col span={3}>
                                <Image width={100} src={"http://localhost:8080/ipfs/" + item[9]}/>
                              </Col>
                              <Col span={1}>{item[2]}</Col>
                              <Col span={2}>{item[3]}</Col>
                              <Col span={7}>{item[4] == this.state.cur_account?"目前无人出价": item[4]}</Col>
                              <Col span={3}>{item[6]}</Col>
                            </Row>
                            <div><br></br></div>
                            </div>
                        )
                    })}
                    </Card>
                    <div><br></br></div>
                    <Card title="我作为竞标人参与的拍卖" style={{ width: 1390}}>
                    <Row>
                        <Col span={2}>nft名称</Col>
                        <Col span={2}>nft预览</Col>
                        <Col span={6}>拍卖者</Col>
                        <Col span={1}>底价</Col>
                        <Col span={2}>当前最高价</Col>
                        <Col span={6}>最高出价人</Col>
                        <Col span={3}>结束时间</Col>
                        <Col span={2}>优势在我？</Col>
                    </Row>
                    <div><br></br></div>
                    {this.state.unfin_list.map((item, idx)=>{
                        return (
                            <div>
                            <Row>
                              <Col span={2}>{item[8]}</Col>
                              <Col span={2}>
                                <Image width={100} src={"http://localhost:8080/ipfs/" + item[9]}/>
                              </Col>
                              <Col span={6}>{item[1]}</Col>
                              <Col span={1}>{item[2]}</Col>
                              <Col span={2}>{item[3]}</Col>
                              <Col span={6}>{item[4]}</Col>
                              <Col span={3}>{item[6]}</Col>
                              <Col span={2}>{item[4] == this.state.cur_account?"是":"否"}</Col>
                            </Row>
                            <div><br></br></div>
                            </div>
                        )
                    })}
                    </Card>
                    <div><br></br></div>
                    <Card title="已经结束的拍卖，胜者是我" style={{ width: 1390}}>
                    <Row>
                        <Col span={2}>nft名称</Col>
                        <Col span={3}>nft预览</Col>
                        <Col span={7}>拍卖者</Col>
                        <Col span={2}>我的出价</Col>
                        <Col span={2}>最高出价人</Col>
                        <Col span={2}></Col>
                    </Row>
                    <div><br></br></div>
                    {this.state.fin_list.map((item, index)=> {
                        return (
                    <div>
                    <Row>
                    <Col span={2}>{item[8]}</Col>
                    <Col span={3}>
                    <Image width={100} src={"http://localhost:8080/ipfs/" + item[9]}/>
                    </Col>
                    <Col span={7}>{item[1]}</Col>
                    <Col span={2}>{item[3]}</Col>
                    <Col span={8}>{item[4]}</Col>
                    <Col span={2}><Button type="primary" shape="round" danger icon={<AlipayCircleFilled />} onClick={()=>this.claim(item[0], item[3])}>认领</Button></Col>
                    </Row>
                    <div><br></br></div>
                    </div>
                        )
                    })}
                    </Card>
                    <div><br></br></div>
                    <Card title="我的流拍" style={{ width: 1390}}>
                    <Row>
                        <Col span={6}>nft名称</Col>
                        <Col span={6}>nft预览</Col>
                        <Col span={6}>我设置的起拍价</Col>
                    </Row>
                    <div><br></br></div>
                    {this.state.my_abort_list.map((item, index)=> {
                        return (
                    <div>
                    <Row>
                    <Col span={6}>{item[8]}</Col>
                    <Col span={6}>
                    <Image width={200} src={"http://localhost:8080/ipfs/" + item[9]}/>
                    </Col>
                    <Col span={6}>{item[2]}</Col>
                    <Col span={6}><Button type="primary" shape="round" size="large" danger icon={<CarryOutOutlined/>} onClick={()=>this.claim(item[0], item[3])}>回收</Button></Col>
                    </Row>
                    <div><br></br></div>
                    </div>
                        )
                    })}
                    </Card>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>Presented By tyz</Footer>
            </Layout>
            </>
        )
    }
}

export default Myauc;