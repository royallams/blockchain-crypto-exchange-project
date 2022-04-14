import {tokens,ether, EVM_REVERT, ETHER_ADDRESS} from './helpers'


const Token = artifacts.require("./Token")
const Exchange = artifacts.require("./Exchange")


require('chai')
.use(require('chai-as-promised'))
.should()




contract('Exchange',([deployer,feeAccount, user1,user2])=>{

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
 


 describe('Making Orders', async()=>{
 	let result

 	beforeEach(async() =>{
 		result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from:user1}) 
 	})

 	it('tracks the newly created order', async()=>{
 		const orderCount = await exchange.orderCount()
 		orderCount.toString().should.equal('1')
 		const order =  await exchange.orders('1')
 		order.user.should.equal(user1, 'user is correct')
 		order.tokenGet.should.equal(token.address, 'tokenGet is Correct')
 	 	order.amountGet.toString().should.equal(tokens(1).toString(),'Amount Get is Correct')
 		order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
 		order.amountGive.toString().should.equal(ether(1).toString(),'Amount Give is correct')
 		order.timestamp.toString().length.should.be.at.least(1,'timestamp is present')

 	})

 	 	it('Emits the order event', async()=>{
 	 	const log = result.logs[0]
 	 	log.event.should.eq('Order')
 	 	const event = log.args
 	 	event.id.toString().should.equal('1','Id is correct')
    	event.user.should.equal(user1, 'user is correct')
 		event.tokenGet.should.equal(token.address, 'tokenGet is Correct')
 	 	event.amountGet.toString().should.equal(tokens(1).toString(),'Amount Get is Correct')
 		event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
 		event.amountGive.toString().should.equal(ether(1).toString(),'Amount Give is correct')
 		event.timestamp.toString().length.should.be.at.least(1,'timestamp is present')

 	})

 })


describe('Order Actions', async()=>{


	beforeEach(async()=>{
		//User1 deposits ether only
		await exchange.depositEther({from:user1,value:ether(1)})
		
		// give tokens to user2
		await token.transfer(user2,tokens(100),{from:deployer})
		//user 2 deposits tokens only
		await token.approve(exchange.address,tokens(2),{from:user2})
		await exchange.depositToken(token.address,tokens(2),{from:user2})

		//user1 makes an order to buy tokens
		await exchange.makeOrder(token.address,tokens(1),ETHER_ADDRESS, ether(1), {from:user1})

	})


	describe('filling order', async()=>{
		let result
		beforeEach(async()=>{
			result = await exchange.fillOrder('1',{from:user2})
		})


		it('executes the trade & charges fees', async()=>{
			let balance
			balance = await exchange.balanceOf(token.address, user1)
			balance.toString().should.equal(tokens(1).toString(),'user1 received tokens')
			balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
			balance.toString().should.equal(ether(1).toString(),'user2 received Ether')
			balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
			balance.toString().should.equal('0','user1 Ether deducted')
			balance = await exchange.balanceOf(token.address, user2)
			balance.toString().should.equal(tokens(0.9).toString(),'user2 Tokens deducted with fee applied')
			const feeAccount = await exchange.feeAccount()
			balance = await exchange.balanceOf(token.address, feeAccount)
			balance.toString().should.equal(tokens(0.1).toString(),'feeAccount received fee')			
			

		})


		it('updates filled orders', async()=>{
			const orderFilled = await exchange.orderFilled(1)
			orderFilled.should.equal(true)
		})

		it('emits a "Trade" event', async()=>{
			const log = result.logs[0]
			log.event.should.eq('Trade')
			const event = log.args
			event.id.toString().should.equal('1', 'id os correct')
			event.user.should.equal(user1,'user is correct')
			event.tokenGet.should.equal(token.address, 'tokenGet is Correct')
			event.amountGet.toString().should.equal(tokens(1).toString(),'AmountGet is correct')
			event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is Correct')
			event.amountGive.toString().should.equal(ether(1).toString(),'amountGive is correct')
			event.userFill.should.equal(user2, 'userFill is correct')
			event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')

		})


	


	})

	describe('cancelling orders', async()=>{

	let result

	describe('success', async()=>{

		beforeEach(async() =>{
			result = await exchange.cancelOrder('1',{from:user1})
		})

		it('updates cancelled orders', async()=>{
			const orderCancelled = await exchange.orderCancelled(1)
			orderCancelled.should.equal(true)
		})


 	 	it('Emits the Cancel event', async()=>{
 	 	const log = result.logs[0]
 	 	log.event.should.eq('Cancel')
 	 	const event = log.args
 	 	event.id.toString().should.equal('1','Id is correct')
    	event.user.should.equal(user1, 'user is correct')
 		event.tokenGet.should.equal(token.address, 'tokenGet is Correct')
 	 	event.amountGet.toString().should.equal(tokens(1).toString(),'Amount Get is Correct')
 		event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
 		event.amountGive.toString().should.equal(ether(1).toString(),'Amount Give is correct')
 		event.timestamp.toString().length.should.be.at.least(1,'timestamp is present')

 	})

	})



	describe('failure', async()=>{
		it('rejects invalid order ids' , async()=>{
			const invalidOrderId = 9999
			await exchange.cancelOrder(invalidOrderId,{from:user1}).should.be.rejectedWith(EVM_REVERT)

		})

		it('rejects unauthorized cancellations', async()=>{
			await exchange.cancelOrder('1',{from:user2}).should.be.rejectedWith(EVM_REVERT)
		})
	})

		describe('failure', async()=>{
			it('rejects invalid order ids', async()=>{
				const invalidOrderId = 99999
				await exchange.fillOrder(invalidOrderId, {from:user2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects already-filled orders', async()=>{
				// Fill the order
				await exchange.fillOrder('1', {from:user2}).should.be.fulfilled

				// Try to fill it again
				await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects cancelled orders', async()=>{
				await exchange.cancelOrder('1', {from: user1}).should.be.fulfilled
				// Try to fill the order
				await exchange.fillOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT)

			})
		})

	})
	




})



})