import threading
from decimal import Decimal
from django.db import connection
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import close_old_connections

from rest_framework.test import APIClient

from .models import Product, Bid

User = get_user_model()


class BidRaceConditionTest(TransactionTestCase):

    reset_sequences = True  # 讓 id 比較可預測（非必要）

    def setUp(self):
        self.seller = User.objects.create_user(username="seller", password="pass12345")
        self.b1 = User.objects.create_user(username="b1", password="pass12345")
        self.b2 = User.objects.create_user(username="b2", password="pass12345")

        self.product = Product.objects.create(
            seller=self.seller,
            title="RaceTest",
            description="desc",
            starting_bid=Decimal("100.00"), 
            current_highest_bid=Decimal("100.00"),
            image_url="",
            location="Taipei",
        )

        self.url = f"/api/products/{self.product.id}/bids/"

    def _post_bid_in_thread(self, username, password, bid_amount, barrier, results, idx):
        """
        每個 thread 用自己的 APIClient + 自己的 DB connection。
        """
        close_old_connections()  # 重要：thread 內使用獨立 DB connection

        client = APIClient()
        ok = client.login(username=username, password=password)
        assert ok, "login failed in test thread"

        barrier.wait()  # 同時起跑

        resp = client.post(self.url, {"bid_amount": str(bid_amount)}, format="json")
        results[idx] = (resp.status_code, resp.data if hasattr(resp, "data") else resp.content)
        connection.close()
        
    def test_concurrent_bids_only_highest_should_win(self):
        """
        兩個人同時出價：
        - b1 出 200
        - b2 出 150
        正確結果：200 成功、150 失敗（400）
        """
        barrier = threading.Barrier(2)
        results = [None, None]

        t1 = threading.Thread(
            target=self._post_bid_in_thread,
            args=("b1", "pass12345", Decimal("200.00"), barrier, results, 0),
        )
        t2 = threading.Thread(
            target=self._post_bid_in_thread,
            args=("b2", "pass12345", Decimal("150.00"), barrier, results, 1),
        )

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        product = Product.objects.get(id=self.product.id)

        # 1️⃣ 最終最高價正確
        self.assertEqual(product.current_highest_bid, Decimal("200.00"))

        # 2️⃣ 最高 bid 記錄正確
        highest_bid = Bid.objects.filter(product=product)\
                                .order_by("-bid_amount")\
                                .first()

        self.assertEqual(highest_bid.bid_amount, Decimal("200.00"))

        statuses = [results[0][0], results[1][0]]
        # 至少有一筆成功
        self.assertIn(201, statuses)