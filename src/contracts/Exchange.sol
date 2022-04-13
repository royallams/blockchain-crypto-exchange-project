// Deposit & Withdraw Funds
//Manage Orders - Make or Cancel 
// Handle Traders - Charge Fees


//TODO:
// [x] Set the Feee account
// [x] Deposit Ether
// [x] Withdraw Ether
// [x] Deposit Tokens
// [x] Withdraw Tokens
// [x] Check Balances
// [x] Make Order 
// [x] Cancel Order
// [] Fil Order
// []  Charge Fees

pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Token.sol";

contract Exchange{
	using SafeMath for uint;

	address public feeAccount;
	uint256 public feePercent;
	address constant ETHER = address(0);// jst to identify it is ether.

	mapping(address => mapping(address => uint256)) public tokens;
	mapping (uint256 => _Order) public orders;
	mapping (uint256 => bool) public orderCancelled;
	mapping (uint256 => bool) public orderFilled;

	uint256 public orderCount;

	

constructor(address _feeAccount, uint256 _feePercent)public {
	feeAccount = _feeAccount;
	feePercent = _feePercent;
}

//Events
event Deposit(address token, address user, uint256 amount, uint256 balance);
event Withdraw(address token, address user, uint256 amount, uint256 balance);
event Order(
	uint id,
	address user,
	address tokenGet,
	uint amountGet,
	address tokenGive,
	uint amountGive,
	uint timestamp);

event Cancel(
	uint id,
	address user,
	address tokenGet,
	uint amountGet,
	address tokenGive,
	uint amountGive,
	uint timestamp);
// a way to Model the order
// a way to store the order 
// add the order to storage


event Trade(
	uint id,
	address user,
	address tokenGet,
	uint amountGet,
	address tokenGive,
	uint amountGive,
	address userFill,
	uint timestamp);


struct _Order {
	uint id;
	address user;
	address tokenGet;
	uint amountGet;
	address tokenGive;
	uint amountGive;
	uint timestamp;
}





// Fallback to revert incase ether is sent to this contract by mistake.
// via sendTransaction Function
function() external{
	revert();
}

function depositEther() payable public {

	tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
	// Store Ether as 0 address with token and the value is updated with latest ether
		emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);

}


function withdrawEther (uint _amount)public {
	require(tokens[ETHER][msg.sender] >= _amount);
	tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);  
	msg.sender.transfer(_amount);// Send back to the user
	emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
 
}


function depositToken (address _token, uint _amount) public returns(bool res)  {
	//Which Token ?
	//How much Amount?
	// Send tokens to this contract
	//Manage Deposit - update balance
	//Emit Event


	//Token creates instance of token in Etherum network
	//Call smart contract function...
	// Transfer from the sender to the current self account of exchange


	//Don't allow Ether Deposits 

	require(_token != ETHER);// Do not allow ether to store..
	require(Token(_token).transferFrom(msg.sender, address(this), _amount));
	tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);// add the the exisint  amount and overrride it.
	emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);

}





function withdrawToken(address _token, uint _amount)public{
	require(_token != ETHER);
	require(tokens[_token][msg.sender] >= _amount);
	tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
	require(Token(_token).transfer(msg.sender, _amount));
	emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);

}


function balanceOf(address _token, address _user) public view returns(uint256){
	return tokens[_token][_user];
}



function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)public{
	

	orderCount= orderCount.add(1);
	orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet , _tokenGive, _amountGive, now);
	emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
}

 

 function cancelOrder(uint256 _id)public{
 	// Must be my order
 	// Must be a valid order

 	_Order storage _order = orders[_id];// get the order
 	require(address(_order.user) == msg.sender);// is it the right owner
 	require(_order.id == _id);// the order must exist
 	orderCancelled[_id]= true;
 	emit  Cancel(
	_order.id,
	_order.user,
	_order.tokenGet,
	_order.amountGet,
	_order.tokenGive,
	_order.amountGive,
	_order.timestamp);

 }

 function fillOrder(uint256 _id)public{
// Fetch the order
// Execute the trade (seperate internal function)

require(_id >0 && _id<=orderCount);
require(!orderFilled[_id]);
require(!orderCancelled[_id]);
 _Order storage _order = orders[_id];// get the order
 _trade(_order.id,_order.user,_order.tokenGet, _order.amountGet, _order.tokenGive,_order.amountGive);
 orderFilled[_order.id] = true;

 }


function _trade(uint _orderId,
	address _user,
	address _tokenGet,
	uint _amountGet,
	address _tokenGive,
	uint _amountGive)
	internal{
//Execute Trade
// Charges Fees
// Emit trade events
// Mark order as filled



// Fee Deducted from _amountGet
uint256 _feeAmount = _amountGive.mul(feePercent).div(100);


//Execute Trade
tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
tokens[_tokenGet][_user]= tokens[_tokenGet][_user].add(_amountGet);
tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
tokens[_tokenGive][_user]= tokens[_tokenGive][_user].sub(_amountGive);
tokens[_tokenGive][msg.sender]= tokens[_tokenGive][msg.sender].add(_amountGive);



// Emit the trade event

emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive,msg.sender, now);

}

}