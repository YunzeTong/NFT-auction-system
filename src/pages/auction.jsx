import React, { Component } from 'react'
import {Button, Menu, Card, Layout, Row, Col, Modal, Form, Image, InputNumber } from 'antd';
import 'antd/dist/antd.css';
import {DollarTwoTone, ZhihuSquareFilled } from '@ant-design/icons'
import ParticlesBg from "particles-bg";
const { Header, Content, Footer } = Layout;


let web3 = require('../initWeb3');
let contract = require('../contract');


class Auction extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            auction_list: [],
            cur_auc_index: 0,
            modal_appear: false,

            past_appear: false,
            view_past_nft: 0,
            cur_owner_list: [],
            highest_price: 0,
            

        }

        this.init_auc()
    }

    init_auc = async() => {
        try{
            let auc_num = await contract.methods.auction_num().call();
            console.log('正在进行的拍卖总数:'+auc_num)
            let auc_list = []
            for (let i=0;i<auc_num;i++){
                let a = await contract.methods.all_auction(i).call()

                let now_time=Date.parse(new Date()) / 1000;
                console.log('当前时间'+now_time)
                
                if (!a[5] && a[6] > now_time){
                    let unixTimestamp = new Date(a[6]*1000);
                    console.log(a[6])
                    a[6] = unixTimestamp.toLocaleString()
                    console.log(a[6])
                    auc_list.push(a)
                }
                // console.log('base' + a[2])
                // console.log('high' + a[3])
            }
            this.setState({
                auction_list: auc_list
            })
        }catch(e){
            console.log('init fail')
        }

    }

    modal_request = async(idx) => {
        //记录当前拍卖的序号:idx
        //获取最高价
        try{
            let auc_p = await contract.methods.all_auction(idx).call()
            console.log('最高价:')
            console.log(auc_p[3])
            console.log('底价:')
            console.log(auc_p[2])
            console.log("更高的"+(auc_p[3] > auc_p[2]?auc_p[3]:auc_p[2]))

            this.setState({
                cur_auc_index: idx,
                modal_appear: true,
                highest_price: (auc_p[3] > auc_p[2]?auc_p[3]:auc_p[2]),
            })
            console.log('更高的价格'+this.state.highest_price)
        }catch(e){
            console.log(e)
        }

    }

    finish_bid = async(values) => {
        try{
            //提交
            console.log('拍卖序号：' + this.state.cur_auc_index + '出价' + values.bid_price)
            
            let account = await web3.eth.getAccounts();
            console.log(account[0])
            let result = await contract.methods.addnewbid(this.state.cur_auc_index, values.bid_price).send({
                from: account[0],
                gas: '3000000'
            })
            console.log('出价返回值：')
            console.log(result)
            //这里目前没有接true or false
            this.setState({
                modal_appear: false
            })
        }catch(e){
            console.log(e)
        }
        
        this.init_auc()

    }

    handleCancel = () => {
        this.setState({
            modal_appear: false,
            past_appear: false
        })
    };

    view_past = async(idx) => {
        console.log('nft序号'+idx)
        let owner_num = await contract.methods.num_of_belongers(idx).call();
        console.log('持有人数量'+owner_num)
        let owner_list = []
        for (let i=0; i<owner_num;i++){
            let o = await contract.methods.past_belongers(idx, i).call()
            owner_list.push(o)
            console.log('获取到的一个新owner'+o)
        }
        console.log('owner_list：')
        console.log(owner_list)

        this.setState({
            past_appear: true,
            view_past_nft: idx,
            cur_owner_list: owner_list
        })
    }

    // go_auction(){
    //     window.location.href = '/auction';
    // }
    go_mynft(){
        window.location.href = '/mynft';
    }
    go_myauc(){
        window.location.href = '/myauc'
    }


    render(){
        document.title = 'Auction System';
        return (
            <>
            <ParticlesBg type="custom" bg={true}/>
            <Layout>
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['3']}>
                        <Menu.Item key="1" onClick={this.go_myauc}>我参与的拍卖</Menu.Item>
                        <Menu.Item key="2" onClick={this.go_mynft}>我的NFT</Menu.Item>
                        <Menu.Item key="3" onClick={()=>this.init_auc()}>查看当前的拍卖</Menu.Item>
                    </Menu>
                 </Header>
                <Content style={{ padding: '0 50px', marginTop: 64 }}>
                    <div style={{ padding: 24, minHeight: 500 }}>
                    <ParticlesBg type="random" bg={true}/>
                    <Card title="查看NFT拍卖情况" style={{ width: 1400}}>
                    <Row>
                        <Col span={2}>nft名称</Col>
                        <Col span={3}>图片预览</Col>
                        <Col span={7}>拍卖者</Col>
                        <Col span={2}>底价</Col>
                        <Col span={2}>当前最高价</Col>
                        {/* <Col span={6}>最高出价人</Col> */}
                        <Col span={3}>结束时间</Col>
                        <Col span={1}></Col>
                        <Col span={1}></Col>
                    </Row>
                    <div><br></br></div>
                    {this.state.auction_list.map((item, idx)=>{
                        return (
                            <div>
                            <Row>
                              <Col span={2}>{item[8]}</Col>
                              <Col span={3}>
                                <Image width={100} src={"http://localhost:8080/ipfs/" + item[9]}/>
                              </Col>
                              <Col span={7}>{item[1]}</Col>
                              <Col span={2}>{item[2]}</Col>
                              <Col span={2}>{item[3]}</Col>
                              {/* <Col span={6}>{item[4]}</Col> */}
                              <Col span={3}>{item[6]}</Col>
                              <Col span={2}>
                                  <Button type="primary" danger shape="round" size="large"onClick={()=>this.modal_request(item[0])} icon={<DollarTwoTone twoToneColor="#52c41a"/>} >竞价</Button>
                              </Col>
                              <Col span={2}>
                                  <Button type="primary" shape="round" size="large" onClick={()=>this.view_past(item[7])} icon={<ZhihuSquareFilled twoToneColor="#eb2f96"/>}>查看过去持有人</Button>
                              </Col>
                            </Row>
                            <div><br></br></div>
                            </div>
                        )
                    })}
                    <Modal title="进行出价" visible={this.state.modal_appear} footer={null} onCancel={()=>this.handleCancel()}>
                    <Row>
                    <p>您的价格需要超过{this.state.highest_price}方竞价成功</p>
                    </Row>
                    <Form onFinish={this.finish_bid.bind(this)} preserve={false} name="basic"
                                layout="horizontal">
                        <Form.Item label="请输入出价(单位:eth)"name='bid_price'>
                        <InputNumber min={this.state.highest_price}></InputNumber>
                        </Form.Item>
                        <Row>
                        <Col flex={2}>
                        <Form.Item>
                        <Button htmlType="submit" type="primary">提交</Button>
                        </Form.Item>
                        </Col>
                        <Col flex={2}>
                        <Form.Item >
                        <Button type="primary" onClick={()=>this.handleCancel()}>取消</Button>
                        </Form.Item>
                        </Col>
                        </Row>
                        </Form>
                    </Modal>
                    <Modal title="所属权流转信息" visible={this.state.past_appear} onCancel={()=>this.handleCancel()} onOk={()=>this.handleCancel()}>
                    {this.state.cur_owner_list.map((item, idx) => {
                        return (
                            <div>
                            <Row>
                            <Col flex={1}>第{idx+1}个持有者</Col>
                            <Col flex={1}>{item}</Col>
                            </Row>
                            <div><br></br></div>
                            </div>
                        )
                        })
                    }
                    </Modal>
                    </Card>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>Presented By tyz</Footer>
            </Layout>
            </>
        )
    }

};

export default Auction;