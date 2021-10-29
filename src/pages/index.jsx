import React from 'react';
import { Layout, Menu } from 'antd';
import 'antd/dist/antd.css';
import ParticlesBg from "particles-bg";

const { Header, Content, Footer } = Layout;

class Index extends React.Component{
    constructor(props){
        super(props);
        this.state = {

        }
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
            <Layout>
                <ParticlesBg type="random" bg={true}/>
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                        <Menu.Item key="1" onClick={this.go_myauc}>我参与的拍卖</Menu.Item>
                        <Menu.Item key="2" onClick={this.go_mynft}>我的NFT</Menu.Item>
                        <Menu.Item key="3" onClick={this.go_auction}>查看拍卖</Menu.Item>
                    </Menu>
                 </Header>
                 {/* <Content className="site-layout" style={{ padding: '0 50px', marginTop: 64 }}>
                     <div className="site-layout-background" style={{ padding: 24, minHeight: 500 }}></div>
                 </Content> */}
                 <Footer style={{ textAlign: 'center' }}>Presented By tyz</Footer>
             </Layout> 
        )
    }
}

export default Index;