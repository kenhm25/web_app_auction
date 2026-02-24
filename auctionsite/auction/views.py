from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from .forms import AuthenticationForm
# Create your views here.
from .models import Product, Bid
from django.views.generic.list import ListView

from django.db.models import Max
def product_list(request):
    products = Product.objects.all()
    return render(request, 'auction/product_list.html', {'products': products})

def product_detail(request, id):
    product = Product.objects.get(id=id)
    highest_bid = Bid.objects.filter(product=product).aggregate(Max('bid_amount'))

    return render(request, 'auction/product_detail.html', {
        'product': product,
        'highest_bid': highest_bid['bid_amount__max']  # amount__max 是由聚合查詢返回的最高出價
    })
from .forms import ProductForm, BidForm

@login_required
def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)
        if form.is_valid():
            p = form.save(commit=False)
            p.seller = request.user
            p.save()
            return redirect('product_list')
    else:
        form = ProductForm()
    return render(request, 'auction/add_product.html', {'form': form})

from django.db import transaction
from django.db.models import Max

@login_required
def add_bid(request, product_id):
    if request.method == 'POST':
        form = BidForm(request.POST)
        if form.is_valid():
            bid_amount = form.cleaned_data['bid_amount']

            with transaction.atomic():
                # 鎖住這筆 product
                product = Product.objects.select_for_update().get(id=product_id)

                highest_bid = Bid.objects.filter(product=product).aggregate(Max('bid_amount'))['bid_amount__max']

                # 如果沒有出價過，最高價用 starting_bid
                current_price = highest_bid if highest_bid else product.starting_bid

                if bid_amount <= current_price:
                    form.add_error('bid_amount', 'Bid must be higher than current price')
                else:
                    Bid.objects.create(
                        product=product,
                        bidder=request.user,
                        bid_amount=bid_amount
                    )
                    return redirect('product_detail', id=product.id)

    else:
        form = BidForm()

    product = get_object_or_404(Product, id=product_id)
    return render(request, 'auction/add_bid.html', {'form': form, 'product': product})
    
from .forms import CustomUserCreationForm
def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password1')  # 注意使用正確的欄位名稱，通常創建表單時的密碼欄位名為 'password1'
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)  # 登入用戶
                return redirect('product_list')  # 重定向到主頁或其他適合的頁面
    else:
        form = CustomUserCreationForm()
    return render(request, 'auction/register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('product_list')  # 假設 'home' 是登錄後的重定向頁面
    else:
        form = AuthenticationForm()
    return render(request, 'auction/login.html', {'form': form})

from django.contrib.auth import logout

def user_logout(request):
    logout(request)  # 登出用戶
    return redirect('product_list')  # 重定向到首頁，'home' 是首頁的 URL 名稱


class UserProductList(ListView):
    model = Product
    template_name = 'auction/user_product_list.html'

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)
    
@login_required
def delete_product(request, pk):
    product = get_object_or_404(Product, pk=pk, seller=request.user)  # 確保只有商品的擁有者可以刪除商品
    product.delete()
    return redirect('myproducts')  # 重定向到商品列表頁面

def search_results(request):
    query = request.GET.get('query', '')
    if query:
        products = Product.objects.filter(title__icontains=query)
    else:
        products = Product.objects.all()
    return render(request, 'auction/search_results.html', {'products': products})




