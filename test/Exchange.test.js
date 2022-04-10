import {tokens,ether, EVM_REVERT, ETHER_ADDRESS} from './helpers'


const Token = artifacts.require("./Token")
const Exchange = artifacts.require("./Exchange")


require('chai')
.use(require('chai-as-promised'))
.should()




contract('Exchange',([deployer,feeAccount, user1])=>{

	let token
	let exchange
	let feePercent =10;

	beforeEach(async()=>{
		//Deploy Token

		token = await Token.new();
		
		//Transfer token to user1
		token.transfer(user1, tokens(100), {from:deployer})

		//Deploy Exchange
		exchange = await Exchange.new(feeAccount, feePercent)

	})

	describe('deployment',()=>{
		it('tracks the FeeAccount', async()=>{
			const result = await exchange.feeAccount()
			result.should.equal(feeAccount)


		})

		it('tracks the feePercent', async()=>{
			const result = await exchange.feePercent()
			result.toString().should.equal(feePercent.toString())
		})
	})

	describe('fallback', ()=>{
		it('reverts when Ether is Sent', async() =>{
			await exchange.sendTransaction({value:1, from:user1}).should.be.rejectedWith(EVM_REVERT)
		})
	})


	describe('Depositing the Ether',()=>{

		let amount
		let result

		describe('success', ()=>{


			beforeEach(async()=>{
				amount = ether(1)
				result = await exchange.depositEther({from:user1 , value:amount})
			})

			it('tracks the Ether Deposit', async()=>{
				const balance = await exchange.tokens(ETHER_ADDRESS, user1)
				balance.toString().should.equal(amount.toString())
			})





			it('emits a deposit Event', async()=>{

				const log = result.logs[0]
				log.event.should.eq('Deposit')
				const event = log.args
				event.token.should.equal(ETHER_ADDRESS,'ETHER address is correct')
				event.user.should.equal(user1,'user address is correct')
				event.amount.toString().should.equal(amount.toString(),'amount is correct')
				event.balance.toString().should.equal(amount.toString(),'balance is correct')


			})

		})
	})

	describe('Withdrawing Ether', async()=>{

		let result

		beforeEach(async()=>{
			await exchange.depositEther({from: user1, value: ether(1)})
		})


		describe('success', async()=>{

			beforeEach(async()=>{
				result = await exchange.withdrawEther(ether(1), {from:user1})

			})



			it('Withdraws Ether Funds', async()=>{
				const balance = await exchange.tokens(ETHER_ADDRESS, user1)
				balance.toString().should.equal('0')
			})


			it('emits a Withdraw Event', async()=>{

				const log = result.logs[0]
				log.event.should.eq('Withdraw')
				const event = log.args
				event.token.should.equal(ETHER_ADDRESS,'Ether address is correct')
				event.user.should.equal(user1,'user address is correct')
				event.amount.toString().should.equal(ether(1).toString(),'amount is correct')
				event.balance.toString().should.equal('0','balance is correct')


			})

		})


		describe('failure', async()=>{

			it('rejects withdraws for insufficient balances ', async()=>{
				await exchange.withdrawEther(ether(100), {from:user1}).should.be.rejectedWith(EVM_REVERT)
			})



		})
	})


	describe('Depositing the Tokens',()=>{

		let amount
		let result

		describe('success', ()=>{


			beforeEach(async()=>{
				amount = tokens(10)
				await token.approve(exchange.address,amount, {from:user1})
				result = await exchange.depositToken(token.address, amount,{from:user1})
			})

			it('tracks the token Deposit', async()=>{
				let balance 
				balance = await token.balanceOf(exchange.address)
				balance.toString().should.equal(amount.toString())

				balance = await exchange.tokens(token.address, user1)
				balance.toString().should.equal(amount.toString())
			})

			it('tracks the feePercent', async()=>{
				const result = await exchange.feePercent()
				result.toString().should.equal(feePercent.toString())
			})




			it('emits a deposit Event', async()=>{

				const log = result.logs[0]
				log.event.should.eq('Deposit')
				const event = log.args
				event.token.should.equal(token.address,'token address is correct')
				event.user.should.equal(user1,'user address is correct')
				event.amount.toString().should.equal(tokens(10).toString(),'amount is correct')
				event.balance.toString().should.equal(tokens(10).toString(),'balance is correct')


			})

		})
	})


	describe('Withdrawing the Tokens',()=>{

		let amount
		let result

		describe('success', ()=>{


			beforeEach(async()=>{
				amount = tokens(10)
				await token.approve(exchange.address,amount, {from:user1})
				await exchange.depositToken(token.address, amount,{from:user1})


			// After depositing now withdraw the tokens

			result = await exchange.withdrawToken(token.address, amount, {from:user1});



		})

			it('Withdraws token funds', async()=>{
				let balance 

				balance = await exchange.tokens(token.address, user1)
				balance.toString().should.equal('0')
			})



			it('emits a withdraw Event', async()=>{

				
				const log = result.logs[0]
  
				log.event.should.eq('Withdraw')
				const event = log.args
				event.token.should.equal(token.address,'token address is correct')
				event.user.should.equal(user1,'user address is correct')
				event.amount.toString().should.equal(amount.toString(),'amount is correct')
				event.balance.toString().should.equal('0','balance is correct')


		})

		})


		describe('failure', async()=>{

			it('rejects for Ether Withdraw', async()=>{
				await exchange.withdrawToken(ETHER_ADDRESS,tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('fails for insufficient balance',async()=>{
				await exchange.withdrawToken(token.address, tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})


	describe('Checking  Balances', async()=>{

		beforeEach(async()=> {
			exchange.depositEther({ from: user1, value: ether(1)})
		})

		it('returns user balance', async()=>{
			const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
			result.toString().should.equal(ether(1).toString())
		})

 
	})





})