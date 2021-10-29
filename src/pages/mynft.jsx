import React, { Component } from 'react'
import {Button, Menu, Card, Layout, Row, Col, Modal, Form, Input, InputNumber, DatePicker, Image, Upload } from 'antd';
import 'antd/dist/antd.css';
import {PlusCircleTwoTone, AccountBookFilled, UploadOutlined} from '@ant-design/icons'
import ParticlesBg from "particles-bg";

const { Header, Content, Footer } = Layout;

let web3 = require('../initWeb3');
let contract = require('../contract');  

const ipfsAPI = require('ipfs-api');
const ipfs =  ipfsAPI({host: 'localhost',port: '5001',protocol: 'http'});

let saveImageOnIpfs = (reader) => {
    return new Promise(function(resolve,reject){
        const buffer = Buffer.from(reader.result);
        ipfs.add(buffer).then((response) => {
            console.log(response)
            resolve(response[0].hash);
            console.log("保存完了")
        }).catch((err) => {
          console.error(err)
          reject(err);
        })
   })
}

class Mynft extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            account: '',
            nft_list: [],
            nft_num: 0,

            modal_appear: false,

            cur_nft_idx: 0,

            ipfs_modal_appear: false,
            img_src: null,
            new_nft_name: '',
            confirm_block: false

        }
        this.initialize_list()
    }

    initialize_list = async() => {
        try{
            console.log('开始渲染')
            let total_nft_num = await contract.methods.nft_num().call();  //nft总数
            let account = await web3.eth.getAccounts();   //当前帐号地址
            let nft_list = []
            let my_num = 0
            

            for (let i=0;i<total_nft_num;i++){
                let n = await contract.methods.all_nft(i).call();
                if (n[1] == account[0])
                {
                    nft_list.push(n);
                    my_num++;
                }
            }

            this.setState({
                nft_list: nft_list,
                account: account[0],
                nft_num: my_num
            })
    
            // this.setState({
            //     nft_list:[..._nft_list],
            // })
            
        }catch(e){
            console.log('渲染失败')
        }

    }

    auc_request = async(idx) => {
        //发起拍卖，这步只是显示弹窗和确定nft序号
        this.setState({
            cur_nft_idx: idx,
            modal_appear: true
        })
    }

    handleCancel = () => {
        console.log('取消弹窗')
        this.setState({
            modal_appear: false,
            ipfs_modal_appear: false,
            confirm_block: false
        })
    };

    finish_set = async(values) => {
        console.log('base:' + values.base_price + 'time:' + values.dual_time)
        var ddl= parseInt(values.dual_time / 1000);
        console.log(ddl)
        try{
            console.log(values.base_price, ddl, this.state.cur_nft_idx)
            
            let account = await web3.eth.getAccounts();
            let auc = await contract.methods.addnewauction(values.base_price, ddl, this.state.cur_nft_idx).send({
                from: account[0],
                gas: '3000000'
            })
            console.log('新拍卖序列号：'+auc)

            this.setState({
                modal_appear: false
            })
        }catch(e){
            console.log('拍卖失败')
        }

        this.initialize_list()
        
    }

    create_img_modal = async() => {
        this.setState({
            ipfs_modal_appear: true
        })
    }


    get_content = (_nft_list) =>{
        console.log('content渲染')
        // console.log(_nft_list)
        return _nft_list.map((item, idx)=>{
                return (
                    <div>
                    <Row>
                        <Col span={3}>{item[4]}</Col>
                        <Col span={5}>
                        <Image width={120} src={"http://localhost:8080/ipfs/" + item[5]}/>
                        </Col>
                        <Col span={7}>{item[1]}</Col>
                        <Col span={3}>{item[2]?"正在拍卖":"未在拍卖"}</Col>
                        <Col span={3}>{item[3]?"购买得来":"自我铸造"}</Col>
                        <Col span={3}>
                        <Button type="primary" disabled={item[2]} danger icon={<AccountBookFilled />} shape="round" onClick={()=>this.auc_request(item[0])}>拍卖</Button>
                        </Col>
                    </Row>
                    <div><br></br></div>
                    </div>
                )
            })
        
    }

    // create_nft = async(values) => {
        // let account = await web3.eth.getAccounts(); 
        // console.log(account[0])
        // try{
        //     let new_num = await contract.methods.addnewnft(account[0]).send({
        //         from: account[0],
        //         gas: '3000000'
        //     })
        // }catch(e){
        //     console.log(e)
        //     console.log('构造失败')
        // }

    //     //保存到智能合约里
    //     let account = await web3.eth.getAccounts(); 
    //     let nft_name = this.store_to_ipfs(values, function(name, hash){
    //         console.log(account[0])
    //         console.log('hash:')
    //         console.log(hash)       //这里后续要改成更直接的名字
    //         console.log('nft name')
    //         console.log(name)
    //         // try{
    //         //     await contract.methods.addnewnft(account[0], this.state.img_src, nft_name).send({
    //         //         from: account[0],
    //         //         gas: '3000000'
    //         //     })
    //         // }catch(e){
    //         //     console.log(e)
    //         //     console.log('构造失败')
    //         // }
    //     })

    
    // }

    store_to_ipfs = async(values) => {
        let file = document.getElementById('file_up').files[0]
        // console.log(file)
        let reader = new FileReader(); 
        reader.readAsArrayBuffer(file)
        console.log(reader)

        reader.onloadend = (e) => {
            try{
                //上传数据到IPFS
                saveImageOnIpfs(reader).then((hash) => {
                    console.log(hash);
                    this.setState({img_src: hash})
                });
            }catch(error){
                console.log(error)
            }
        }
    
    
        this.setState({
            ipfs_modal_appear: false,
            new_nft_name: values.up_name,
            confirm_block: true
        })
    }

    checkmate_nft = async() => {
        console.log('来喽')
        let account = await web3.eth.getAccounts()
        console.log(account[0], this.state.new_nft_name, this.state.img_src)
        try{
            await contract.methods.addnewnft(account[0], this.state.img_src, this.state.new_nft_name).send({
                from: account[0],
                gas: '3000000'
            })
        }catch(e){
            console.log(e)
            console.log('构造失败')
        }
        this.setState({
            confirm_block: false
        })

        this.initialize_list()

    }

    go_auction(){
        window.location.href = '/auction';
    }
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
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                        <Menu.Item key="1" onClick={this.go_myauc}>我参与的拍卖</Menu.Item>
                        <Menu.Item key="2" onClick={()=>this.initialize_list()}>查看我的NFT</Menu.Item>
                        <Menu.Item key="3" onClick={this.go_auction}>拍卖市场</Menu.Item>
                    </Menu>
                 </Header>
                <Content style={{ padding: '0 50px', marginTop: 64 }}>
                {/* className="site-layout" */}
                {/* className="site-layout-background" */}
                    <div style={{ padding: 24, minHeight: 500 }}>
                    <ParticlesBg type="random" bg={true}/>
                    <Card title="我的NFT" style={{ width: 1390}}>
                    <Button type="primary" shape="round"size="large" block onClick={()=>this.create_img_modal()} icon={<PlusCircleTwoTone />}>铸造NFT</Button>
                    <Modal title="确认铸造?" visible={this.state.confirm_block} onCancel={()=>this.handleCancel()} onOk={()=>this.checkmate_nft()} >
                    </Modal>
                    <Modal title="铸造nft" visible={this.state.ipfs_modal_appear} footer={null} onCancel={()=>this.handleCancel()}>
                    <Form onFinish={this.store_to_ipfs.bind(this)} preserve={false} name="pic_upload"layout="horizontal">
                        <Form.Item label="请输入nft命名" name="up_name">
                        <Input type="text" />
                        </Form.Item>
                        <Form.Item label="请上传图片"name='up_img'>
                        <Input type="file" id="file_up" multiple="multiple"/>
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
                        </Col></Row>
                        </Form>
                    </Modal>
                    <div><br></br></div>
                    <Row>
                        <Col span={3}>nft名称</Col>
                        <Col span={5}>点击可预览</Col>
                        <Col span={7}>nft所有者</Col>
                        <Col span={3}>是否正在拍卖中</Col>
                        <Col span={3}>来源：铸造0/购买1</Col>
                    </Row>
                    <div><br></br></div>
                    {this.get_content(this.state.nft_list)}
                    {/*这里原来直接填充 */}
                    <Modal title="设置拍卖信息" visible={this.state.modal_appear} footer={null} onCancel={()=>this.handleCancel()}>
                        <Form onFinish={this.finish_set.bind(this)} preserve={false} name="basic"
                                layout="horizontal">
                        <Form.Item label="请输入底价(单位:eth)"name='base_price'>
                        <InputNumber min={0}></InputNumber>
                        </Form.Item>
                        <Form.Item label="请输入预期拍卖时间(单位:s)"name='dual_time'>
                        <DatePicker showTime></DatePicker>
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
                    </Card>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>Presented By tyz</Footer>
            </Layout>
            </>
        )
    }

}

export default Mynft;