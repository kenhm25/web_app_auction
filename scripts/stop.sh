# stop the service with the cluster left
kubectl scale deployment auction-api --replicas=0
kubectl scale deployment auction-frontend --replicas=0
kubectl scale statefulset postgres --replicas=0
kubectl scale deployment redis --replicas=0
# or
# kubectl scale deployment --all --replicas=0 && \
# kubectl scale statefulset postgres --all --replicas=0