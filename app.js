require('dotenv').config({ path: "./config.env" }) ;
const Web3 = require('web3');
const {ether_unicrypt_abi,ether_unicrypt_address, ether_lptoken_abi, ether_erc20_abi} = require('./unicrypt.js');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const dbo = require("./db/conn");
const { lock } = require('./routes/record.js');

const infuraKey = process.env.INFURA_KEY;

const web3 = new Web3(new Web3.providers.HttpProvider( `https://mainnet.infura.io/v3/${infuraKey}`));

const etherUnicrypt = new web3.eth.Contract(ether_unicrypt_abi, ether_unicrypt_address);

async function saveEtherUnicryptTokens() {
    var lockedCount = await etherUnicrypt.methods.getNumLockedTokens().call();
    console.log(lockedCount);
    for(i=0; i<lockedCount; i++) {
        var lpTokenAddress = await etherUnicrypt.methods.getLockedTokenAtIndex(i).call();
        console.log(i,"=", lpTokenAddress);
        const lptoken = new web3.eth.Contract(ether_lptoken_abi, lpTokenAddress);
        var tokenAddress1 = await lptoken.methods.token0().call();
        var tokenAddress2 = await lptoken.methods.token1().call();        
        const erc20token1 = new web3.eth.Contract(ether_erc20_abi, tokenAddress1);
        const erc20token2 = new web3.eth.Contract(ether_erc20_abi, tokenAddress2);
        var tokenSymbol1 = await erc20token1.methods.symbol().call();
        var tokenName1 = await erc20token1.methods.name().call();
        var tokenBalance1 = await erc20token1.methods.balanceOf(lpTokenAddress).call();
        var tokenBalance2 = await erc20token2.methods.balanceOf(lpTokenAddress).call();
        var tokenSymbol2 = await erc20token2.methods.symbol().call();
        var tokenName2 = await erc20token2.methods.name().call();
        console.log("addr1=", tokenAddress1, ", name=", tokenName1, ", symbol=", tokenSymbol1);
        console.log("addr2=", tokenAddress2, ", name=", tokenName2, ", symbol=", tokenSymbol2);
    
        var holderCount = await etherUnicrypt.methods.getNumLocksForToken(lpTokenAddress).call();
        var holders = [];
        for(var j=0; j<holderCount; j++) {
            var lockInfo = await etherUnicrypt.methods.tokenLocks(lpTokenAddress, j).call();
            console.log("successfully get holder(",j,") info");
            holders[j] = {
                lockDate:lockInfo.lockDate, 
                unlockDate:lockInfo.unlockDate, 
                amount:lockInfo.amount, 
                initialAmount:lockInfo.initialAmount, 
                owner:lockInfo.owner, 
                lockID:lock.lockID
            };
        }

        var addItem = {
            lpToken : lpTokenAddress,
            locker : "Unicrypt",
            token1 : tokenAddress1,
            token2 : tokenAddress2,
            tokenSymbol1 : tokenSymbol1,
            tokenSymbol2 : tokenSymbol2,
            tokenBalance1 : tokenBalance1,
            tokenBalance2 : tokenBalance2,
            tokenName1 : tokenName1,
            tokenName2 : tokenName2,
            holders : holders
        };
        console.log("add item(", i, ")=", addItem);
        let db_connect = dbo.getDb();
        db_connect.collection("lptoken").insertOne(addItem, function (err, res) {
          if (err) throw err;
        });    
        console.log("successfully added, ", i);
    }

    console.log("end");    
}

//3. Make calls
var getCoingecko = async() => {
    // let coin = await CoinGeckoClient.coins.fetch("usd-coin", {localization:false, tickers:false, community_data:false, developer_data:false, market_data:false});   
    // console.log(coin);
    // return;

    // let markets = await CoinGeckoClient.coins.markets({vs_currency:"usd"});
    // if(markets.success == true) {
    //     console.log(markets.data);
    // }
    // return;
    let list = await CoinGeckoClient.coins.list();
    if(list.success!=true) {
        console.log("error - coins.list");
        return;
    }
    console.log("coin count=", list.data.length);
    for(i=0; i<list.data.length; i++) {
        try {            
            console.log("fetch market - ", i);
            let coin = await CoinGeckoClient.coins.fetch(list.data[i].id, {localization:false, tickers:false, community_data:false, developer_data:false, market_data:false});
            if(coin.success == false) {
                console.log(i, " - failed!");
                continue;
            }
            let coin_data = {id:list.data[i].id, symbol:list.data[i].symbol, name : list.data[i].name, platforms: coin.data.platforms};
            console.log(i, "=", coin_data);
        } catch (error) {
            console.log(i, " - exception");  
        }
    }
    return;
    let db_connect = dbo.getDb();
    db_connect.collection("coingecko").insertMany(data.data, function (err, res) {
      if (err) throw err;
      response.json(res);
    });    
    console.log("success");
};
dbo.connectToServer(function (err) {
    if (err) console.error(err);
    // getCoingecko();
    saveEtherUnicryptTokens();
  });

    // saveEtherUnicryptTokens();
//   getCoingecko();