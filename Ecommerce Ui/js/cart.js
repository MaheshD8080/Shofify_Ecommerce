let cart = JSON.parse(localStorage.getItem("cart")) || [];
function loadCart()
{
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartItems = document.getElementById("cart-items");
    let totalAmount=0;
    cartItems.innerHTML="";

    cart.forEach((item,index) => {
        let itemTotal=item.price * item.quantity;
        totalAmount+=itemTotal;
        

        cartItems.innerHTML +=`

            <tr>
                <td><img src="${item.imageUrl}" width="50"></td>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="changeQuantity(${index},-1)">-</button>
                    ${item.quantity}
                    <button class="btn btn-sm btn-secondary" onclick="changeQuantity(${index},1)">+</button>
                </td>
                <td>₹ ${itemTotal}</td>
                <td><button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">X</button></td>
            </tr>
        `;
    });
    document.getElementById("total-amount").innerText=totalAmount;
    // Enable/disable the Proceed button depending on cart total
    try{
        const proceedBtn = document.getElementById('proceed-btn');
        if(proceedBtn){
            proceedBtn.disabled = !(totalAmount > 0);
        }
    }catch(e){console.warn(e)}
}

function addToCart(id,name,price,imageUrl)
{
    console.log("Adding product to cart:",id,name,price,imageUrl);

    price=parseFloat(price);
    let itemIndex=cart.findIndex((item) => item.id===id)
    if(itemIndex!==-1)
    {
        cart[itemIndex].quantity+=1;
    }
    else{
        cart.push({
            id:id,  // for easy tracking
            name: name,
            price: price,
            imageUrl:imageUrl,
            quantity:1
        });      
    }
    localStorage.setItem("cart",JSON.stringify(cart));
    updateCartCounter();
    
}


function updateCartCounter()
{
    try{
        const stored = JSON.parse(localStorage.getItem("cart")) || [];
        // show total quantity (sum of item quantities)
        const count = stored.reduce((s,i) => s + (i.quantity||0), 0);
        const badge = document.querySelector(".cart-badge");
        if(badge) badge.innerText = count;
    }catch(e){
        console.error('updateCartCounter error',e);
    }
}


function changeQuantity(index,change)
{
    let cart= JSON.parse(localStorage.getItem("cart")) || [];
    if(typeof change !== 'number') return;
    cart[index].quantity+=change;
    if(cart[index].quantity<=0) cart.splice(index,1);
    localStorage.setItem("cart",JSON.stringify(cart));
    loadCart();
    updateCartCounter();
}

function removeFromCart()
{
    // placeholder - replaced by removeFromCart(index)
}

function removeFromCart(index){
    let cart= JSON.parse(localStorage.getItem("cart")) || [];
    if(typeof index !== 'number') return;
    cart.splice(index,1);
    localStorage.setItem("cart",JSON.stringify(cart));
    loadCart();
    updateCartCounter();
}


document.addEventListener("DOMContentLoaded",() => { loadCart(); updateCartCounter(); });
