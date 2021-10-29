pragma solidity ^0.5.16;

contract bid{
    //最大nft序号
    uint public nft_num;
    //唯一nft序号=>单个nft
    mapping(uint=>single_nft) public all_nft;

    //最大拍卖序列号
    uint public auction_num;
    //唯一拍卖序列号=>单次拍卖
    mapping(uint=>single_auction) public all_auction;

    mapping(uint=>uint) public num_of_belongers;
    mapping(uint=>address[]) public past_belongers;

    mapping(address=>uint) public evolve_num;
    mapping(address=>single_auction[]) public my_evolve;

    struct single_nft{
        uint index;
        address owner;
        bool under_auction_or_not;
        bool own_or_buy;    //own:0;buy:1
        string nft_name;
        string nft_hash;
        
    }

    struct single_auction{
        uint index;
        address payable beneficiary;
        uint basebid;
        uint highestbid;
        address payable highest_bidder;
        bool end_or_not;
        uint endtime; 
        uint index_of_nft;
        string nft_name;
        string nft_hash;
    }

    function addnewnft(address _owner, string memory _nft_hash, string memory _nft_name) public{
        single_nft memory new_nft = single_nft(nft_num, _owner, false, false, _nft_name, _nft_hash);
        all_nft[nft_num] = new_nft;
        num_of_belongers[nft_num] = 1;
        past_belongers[nft_num].push(_owner);
        nft_num += 1;
    }

    //受益人作为msg.sender发起
    function addnewauction(uint _basebid, uint ddl, uint _index_of_nft) public returns (uint){
        single_auction memory new_auction = single_auction(auction_num, msg.sender, _basebid, 0, msg.sender, false, ddl, _index_of_nft, all_nft[_index_of_nft].nft_name, all_nft[_index_of_nft].nft_hash);
        all_auction[auction_num] = new_auction;
        auction_num++;
        all_nft[_index_of_nft].under_auction_or_not = true;

        //追加evolve
        evolve_num[msg.sender] += 1;
        my_evolve[msg.sender].push(new_auction);

        return auction_num - 1;
    }

    //出价人作为msg.sender
    function addnewbid(uint _index_of_auction, uint _new_price) public{
        require(all_auction[_index_of_auction].beneficiary != msg.sender, 'no myself');
        
        single_auction storage cur_auction = all_auction[_index_of_auction];

        //若不为0，证明不是第一个竞拍者，修改上一个失败的竞拍者的状态
        if (cur_auction.highestbid != 0){
            //把上一个竞争失败者的状态进行改变
            for (uint i=0;i<evolve_num[cur_auction.highest_bidder];i++){
                if (my_evolve[cur_auction.highest_bidder][i].index == _index_of_auction){  //找到过去参与者参与的拍卖
                    my_evolve[cur_auction.highest_bidder][i].highest_bidder = msg.sender;
                    my_evolve[cur_auction.highest_bidder][i].highestbid = _new_price;
                    break;
                }
            }
        }

        //更新拍卖情况
        cur_auction.highest_bidder = msg.sender;
        cur_auction.highestbid = _new_price;

        //追加evolve
        uint flag = 0;
        for (uint j=0;j<evolve_num[msg.sender];j++){  //若msg.sender不是第一次出价，则修改之前的竞标记录
            if (my_evolve[msg.sender][j].index == _index_of_auction ){
                flag = 1;
                my_evolve[msg.sender][j].highest_bidder = msg.sender;
                my_evolve[msg.sender][j].highestbid = _new_price;
                break;
            }
        }
        //若msg.sender第一次对拍卖出价，则直接添加
        if (flag == 0){
            evolve_num[msg.sender] += 1;
            my_evolve[msg.sender].push(cur_auction);
        }


    }

    //拍卖结束，debug的时候用的，实际上最后成品没用上
    function finish_auction(uint _index_of_auction) view public{
        require(block.timestamp > all_auction[_index_of_auction].endtime, 'time is not over');
        require(!all_auction[_index_of_auction].end_or_not, 'auction has checkmated');
    }


    //确认付款, msg.value被打入合约，前端要先设置好value
    function pay_for_auction(uint _index_of_auction) public payable{
        require(msg.value >= all_auction[_index_of_auction].highestbid, 'short of money');

    }


    //购买者发起, msg.sender
    function checkmate_auction(uint _index_of_auction) public payable{
        single_auction storage fin_auction = all_auction[_index_of_auction];
        single_nft storage change_nft = all_nft[fin_auction.index_of_nft];

        all_auction[_index_of_auction].beneficiary.transfer(all_auction[_index_of_auction].highestbid * 1 ether);
        //修改nft状态
        change_nft.owner = msg.sender;
        change_nft.under_auction_or_not = false;
        if (msg.sender != all_auction[_index_of_auction].beneficiary){   //如果拍卖者和受益人是同一个，说明nft还是自己的
            change_nft.own_or_buy = true;
        }
        //修改auction状态
        fin_auction.end_or_not = true;
        for (uint i=0;i<evolve_num[msg.sender];i++){
            if (my_evolve[msg.sender][i].index == _index_of_auction){
                my_evolve[msg.sender][i].end_or_not = true;
                break;
            }
        }

        //修改所属权
        num_of_belongers[fin_auction.index_of_nft] += 1;
        past_belongers[fin_auction.index_of_nft].push(msg.sender);

    }



}