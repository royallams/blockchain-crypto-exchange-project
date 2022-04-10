// Deposit & Withdraw Funds
//Manage Orders - Make or Cancel 
// Handle Traders - Charge Fees


//TODO:
// [] Set the Feee account
// [] Deposit Ether
// [] Withdraw Ether
// [] Deposit Tokens
// [] Withdraw Tokens
// [] Check Balances
// [] Make Order 
// [] Cancel Order
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

constructor(address _feeAccount, uint256 _feePercent)public {
	feeAccount = _feeAccount;
	feePercent = _feePercent;
}

//Events
event Deposit(address token, address user, uint256 amount, uint256 balance);
event Withdraw(address token, address user, uint256 amount, uint256 balance);



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






}